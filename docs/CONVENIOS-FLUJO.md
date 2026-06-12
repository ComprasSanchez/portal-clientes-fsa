# Flujo de Convenios en `crm-webservice`

## Objetivo

Este documento explica:

- cómo funciona hoy el manejo de convenios en `crm-webservice`
- dónde se guardan los datos
- qué diferencia hay entre `convenio`, `canal` y `sucursal_codigo`
- cómo integrar convenios desde otro frontend distinto de `sorteo_front`

## Resumen corto

En este backend, el dato `convenio`:

- puede llegar desde el frontend como texto libre o seleccionado desde catálogo
- se intenta resolver contra la tabla `Convenios`
- si no existe, se crea automáticamente como `PENDIENTE`
- se guarda primero en el pendiente (`crm_pendientes.payload_json`)
- y luego, al aplicar la verificación, termina en `clientes_new.convenio`

No es una validación estricta que bloquee el alta si el convenio no existe.

## Tablas involucradas

### 1. `Convenios`

Es el catálogo de convenios.

Campos relevantes:

- `id`
- `institucion`
- `estado`
- `origen`

Comportamiento:

- si el convenio existe, se reutiliza
- si no existe, se inserta como:
  - `estado = 'PENDIENTE'`
  - `origen = 'MANUAL'`

Código:

- [services/conveniosCatalog.service.js](C:/Users/Usuario/Documents/front-fsa/crm-webservice/services/conveniosCatalog.service.js:37)

### 2. `crm_pendientes`

Guarda el payload del alta/actualización antes de que el proceso quede aplicado.

Campo relevante:

- `payload_json`

Ahí queda el `Convenio` ya normalizado si fue resuelto.

Código:

- [services/pending.service.js](C:/Users/Usuario/Documents/front-fsa/crm-webservice/services/pending.service.js:235)

### 3. `clientes_new`

Es donde queda el dato final del cliente dentro de este backend.

Campo relevante:

- `convenio`

Código:

- [services/pending.service.js](C:/Users/Usuario/Documents/front-fsa/crm-webservice/services/pending.service.js:392)
- [services/pending.service.js](C:/Users/Usuario/Documents/front-fsa/crm-webservice/services/pending.service.js:522)

## Endpoints relacionados

### `GET /convenios/search`

Sirve para buscar convenios por nombre desde el frontend.

Query params:

- `q`: texto a buscar
- `limit`: cantidad máxima
- `include_pending`: si se incluyen convenios `PENDIENTE`

Comportamiento:

- busca primero por prefijo
- si no encuentra, busca por contains
- por default incluye `ACTIVO` y `PENDIENTE`

Código:

- [routes/convenios.routes.js](C:/Users/Usuario/Documents/front-fsa/crm-webservice/routes/convenios.routes.js:5)
- [repositories/convenios.repository.js](C:/Users/Usuario/Documents/front-fsa/crm-webservice/repositories/convenios.repository.js:9)

### `POST /cliente/alta`

Inicia el alta de un cliente nuevo y la verificación telefónica.

### `POST /cliente/verificar/telefono`

Inicia una actualización de cliente existente y la verificación telefónica.

En ambos casos, el backend recibe `convenio` y lo procesa igual.

Código:

- [controllers/clienteController.js](C:/Users/Usuario/Documents/front-fsa/crm-webservice/controllers/clienteController.js:75)
- [controllers/clienteController.js](C:/Users/Usuario/Documents/front-fsa/crm-webservice/controllers/clienteController.js:126)

## Flujo completo del convenio

### 1. El frontend envía el convenio

El frontend puede mandar el convenio con cualquiera de estas claves:

- `Convenio`
- `convenio`
- `convenio_nombre`
- `convenioNombre`

El backend también acepta opcionalmente:

- `convenio_id`
- `ConvenioId`
- `convenioId`

Código:

- [helpers/updateDtoBuilder.js](C:/Users/Usuario/Documents/front-fsa/crm-webservice/helpers/updateDtoBuilder.js:90)
- [services/conveniosCatalog.service.js](C:/Users/Usuario/Documents/front-fsa/crm-webservice/services/conveniosCatalog.service.js:50)

### 2. Se normaliza el DTO

Antes de iniciar el pendiente, `buildDtoFromPlex` arma un DTO unificado con:

- documento
- teléfono
- datos personales
- obra social
- convenio
- canal
- sucursal

Código:

- [helpers/updateDtoBuilder.js](C:/Users/Usuario/Documents/front-fsa/crm-webservice/helpers/updateDtoBuilder.js:49)

### 3. Se resuelve el convenio

La lógica es:

1. buscar por `convenio_id`
2. si no existe, buscar por nombre exacto normalizado
3. si no existe, crear uno nuevo como `PENDIENTE`
4. devolver el convenio canónico

Código:

- [services/conveniosCatalog.service.js](C:/Users/Usuario/Documents/front-fsa/crm-webservice/services/conveniosCatalog.service.js:50)

### 4. Se guarda en el pendiente

Si el convenio pudo resolverse:

- `dtoN.Convenio = convenio.nombre`

Si no:

- se elimina del payload antes de persistir

Código:

- [services/pending.service.js](C:/Users/Usuario/Documents/front-fsa/crm-webservice/services/pending.service.js:235)

### 5. Se aplica al cliente final

Una vez confirmada la verificación telefónica, el pendiente se aplica y el valor se guarda en:

- `clientes_new.convenio`

Código:

- [services/pending.service.js](C:/Users/Usuario/Documents/front-fsa/crm-webservice/services/pending.service.js:443)
- [services/pending.service.js](C:/Users/Usuario/Documents/front-fsa/crm-webservice/services/pending.service.js:513)

## Diferencia entre `convenio`, `canal` y `sucursal_codigo`

Estos tres datos no significan lo mismo.

### `convenio`

Representa la empresa, institución o convenio al que pertenece el cliente.

Ejemplos:

- `COCACOLA`
- `YPF`
- `MUNICIPALIDAD DE SALTA`

Destino:

- tabla `Convenios`
- columna `clientes_new.convenio`

### `canal`

Representa el origen comercial o funcional del alta.

Ejemplos:

- `CONVENIO`
- `QR`
- `WEB`
- `SOCIOSA_PORTAL`

Destino:

- columna `clientes_new.canal`

### `sucursal_codigo`

Representa una sucursal real, código de boca, punto físico o agrupador operativo.

Ejemplos posibles:

- `SUC01`
- `SALTA_CENTRO`
- `19`

Destino:

- columna `clientes_new.sucursal_codigo`

Si un valor como `cocacola` representa empresa y no sucursal, no conviene guardarlo en `sucursal_codigo`.

## Cómo integrarlo desde otro frontend

No hace falta usar `sorteo_front`. Cualquier frontend puede integrarse si envía el payload correcto.

### Opción recomendada

1. ofrecer un autocomplete que consulte `GET /convenios/search`
2. permitir elegir un convenio existente
3. opcionalmente permitir texto libre
4. enviar el valor elegido en `convenio` o `Convenio`

### Payload mínimo ejemplo para alta

```json
{
  "documento": "30123456",
  "telefono": "5493871234567",
  "nombre": "JUAN",
  "apellido": "PEREZ",
  "email": "juan@email.com",
  "canal": "CONVENIO",
  "convenio": "COCACOLA",
  "aceptaTerminos": true
}
```

Endpoint:

- `POST /cliente/alta`

### Payload mínimo ejemplo para actualización

```json
{
  "documento": "30123456",
  "telefono": "5493871234567",
  "canal": "CONVENIO",
  "convenio": "COCACOLA",
  "aceptaTerminos": true
}
```

Endpoint:

- `POST /cliente/verificar/telefono`

### Claves aceptadas

Por compatibilidad, el backend acepta tanto camelCase como PascalCase.

Ejemplos equivalentes:

```json
{
  "convenio": "COCACOLA"
}
```

```json
{
  "Convenio": "COCACOLA"
}
```

## Integración sugerida en un frontend nuevo

### Escenario A. El usuario elige manualmente su convenio

Usar:

- `GET /convenios/search?q=coca`

Luego enviar:

```json
{
  "canal": "CONVENIO",
  "convenio": "COCACOLA"
}
```

### Escenario B. El convenio viene predefinido por un link o QR

Si el link representa una empresa puntual, el frontend puede setear directamente:

```json
{
  "canal": "CONVENIO",
  "convenio": "COCACOLA"
}
```

En ese caso:

- no hace falta usar `sucursal_codigo`
- puede dejarse vacío o no enviarse

### Escenario C. El convenio no existe aún

El frontend puede mandar igual:

```json
{
  "canal": "CONVENIO",
  "convenio": "EMPRESA NUEVA XYZ"
}
```

El backend:

- intentará encontrarlo
- si no existe, lo creará en `Convenios` como `PENDIENTE`
- continuará el flujo sin bloquear el alta

## Recomendaciones de diseño

### Recomendado

- usar `convenio` para empresa o institución
- usar `canal` para origen del alta
- usar `sucursal_codigo` solo si existe una sucursal real

### No recomendado

- usar `sucursal_codigo` para guardar nombres de empresa
- duplicar el mismo valor en `convenio` y `sucursal_codigo`

## Consideraciones importantes

### 1. El alta local no significa que exista en Plex

Aunque el cliente quede en `clientes_new`, la búsqueda inicial por DNI hoy se apoya en Plex.

Código:

- [controllers/clienteController.js](C:/Users/Usuario/Documents/front-fsa/crm-webservice/controllers/clienteController.js:15)

### 2. `clientes_new` es la persistencia efectiva de este flujo

Si el convenio quedó en `clientes_new.convenio`, entonces el backend de verificación ya lo guardó correctamente.

### 3. `clientes-fsa` es una sincronización posterior

Después de aplicar el pendiente, se intenta sincronizar el cliente hacia `clientes-fsa`, pero eso no define la lógica de convenio dentro de `crm-webservice`.

Código:

- [services/clientesFsaSync.service.js](C:/Users/Usuario/Documents/front-fsa/crm-webservice/services/clientesFsaSync.service.js:10)

## Checklist para integrar convenios desde otro frontend

- definir si el convenio será manual, por catálogo o por link
- enviar `canal = CONVENIO` si corresponde a ese origen
- enviar `convenio` con el nombre de la empresa
- no usar `sucursal_codigo` salvo que realmente exista una sucursal
- usar `GET /convenios/search` si querés autocomplete
- llamar a `POST /cliente/alta` o `POST /cliente/verificar/telefono`

## Conclusión

El sistema actual trata a `convenio` como un dato flexible:

- lo recibe del frontend
- lo normaliza
- lo resuelve contra catálogo
- lo crea si no existe
- lo guarda en `clientes_new`

Para otro frontend, la integración correcta no depende de `sorteo_front`. Solo hace falta:

- enviar `convenio` correctamente
- usar `canal` como metadata de origen
- evitar reutilizar `sucursal_codigo` para empresas cuando no representa una sucursal real
