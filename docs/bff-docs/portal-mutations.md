# Portal Mutations

## Objetivo

Este documento explica los endpoints de `portal/me` que sirven para modificar datos del cliente autenticado.

Está pensado para frontend e incluye:

- qué endpoint usar
- qué body mandar
- qué permisos requiere
- cómo autenticarse en ambientes publicados
- qué devuelve cada operación

## Alcance

Estos endpoints cubren dos grupos de datos:

- contactos
- domicilios

Todos están expuestos bajo:

- `/api/v1/portal/me`

## Autenticación en ambientes publicados

Si frontend consume el gateway publicado, por ejemplo:

- `https://api.dev.sanchezantoniolli.com.ar/api/v2/sociosa/api/v1/portal/me/...`

la autenticación efectiva puede resolverse con la sesión web activa usando estas cookies:

- `sid`
- `trusted_device_token`

En ese escenario no hace falta mandar `Authorization` manualmente si la sesión ya está vigente.

## Permiso requerido

Todos los endpoints de este documento requieren:

- `sociosa:write`

## Query param opcional

Todos aceptan opcionalmente:

- `accountKind=CLIENTE|COLABORADOR`

Si frontend no necesita distinguir explícitamente entre ambos, puede omitirlo.

## Respuesta base

Todas las mutaciones exitosas de `portal/me` responden:

```json
{
  "ok": true
}
```

## Endpoints de contactos

### 1. Crear contacto

- `POST /api/v1/portal/me/contactos`

Body:

```json
{
  "tipo": "EMAIL",
  "valor": "usuario@email.com",
  "regionIso2": "AR",
  "principal": false,
  "verificado": false
}
```

Reglas principales:

- `tipo`: `EMAIL` o `TELEFONO`
- `valor`: string requerido, hasta 180 caracteres
- `regionIso2`: opcional, 2 caracteres
- `principal`: opcional
- `verificado`: opcional

Ejemplo `curl` con cookies:

```bash
curl.exe --location --request POST "https://api.dev.sanchezantoniolli.com.ar/api/v2/sociosa/api/v1/portal/me/contactos" ^
  --header "Cookie: sid=TU_SID; trusted_device_token=TU_TRUSTED_DEVICE_TOKEN" ^
  --header "Content-Type: application/json" ^
  --header "x-request-id: portal-add-contacto-001" ^
  --data "{\"tipo\":\"EMAIL\",\"valor\":\"usuario@email.com\",\"regionIso2\":\"AR\",\"principal\":false,\"verificado\":false}"
```

### 2. Modificar contacto

- `PATCH /api/v1/portal/me/contactos/:contactoId`

Body: usa el mismo contrato que crear contacto.

Ejemplo:

```json
{
  "tipo": "TELEFONO",
  "valor": "+5493511234567",
  "regionIso2": "AR",
  "principal": true,
  "verificado": true
}
```

### 3. Eliminar contacto

- `DELETE /api/v1/portal/me/contactos/:contactoId`

No requiere body.

### 4. Marcar contacto principal

- `PATCH /api/v1/portal/me/contactos/principal`

Importante:

- esta operación no edita un contacto existente por `id`
- se usa solo para marcar como principal un contacto ya existente
- si por error se mezcla esta ruta con una operación de edición, el síntoma esperable es un `400` relacionado con `contactoId must be a UUID`

Body:

```json
{
  "tipo": "EMAIL",
  "valor": "usuario@email.com"
}
```

### 5. Desmarcar contacto principal

- `PATCH /api/v1/portal/me/contactos/principal/unset`

Body:

```json
{
  "tipo": "EMAIL"
}
```

## Endpoints de domicilios

### 1. Crear domicilio

- `POST /api/v1/portal/me/domicilios`

Body:

```json
{
  "etiqueta": "Casa",
  "calle": "Av. Siempre Viva",
  "numero": "123",
  "piso": "2",
  "depto": "B",
  "referencia": "Puerta negra",
  "ciudad": "Cordoba",
  "provincia": "Cordoba",
  "codPostal": "5000",
  "pais": "Argentina",
  "lat": -31.4167,
  "long": -64.1833,
  "principal": true
}
```

Reglas principales:

- `calle`, `ciudad`, `provincia` son requeridos
- `pais` es opcional en create
- `principal` es opcional
- `lat` y `long` son opcionales numéricos

Ejemplo `curl` con cookies:

```bash
curl.exe --location --request POST "https://api.dev.sanchezantoniolli.com.ar/api/v2/sociosa/api/v1/portal/me/domicilios" ^
  --header "Cookie: sid=TU_SID; trusted_device_token=TU_TRUSTED_DEVICE_TOKEN" ^
  --header "Content-Type: application/json" ^
  --header "x-request-id: portal-add-domicilio-001" ^
  --data "{\"etiqueta\":\"Casa\",\"calle\":\"Av. Siempre Viva\",\"numero\":\"123\",\"ciudad\":\"Cordoba\",\"provincia\":\"Cordoba\",\"codPostal\":\"5000\",\"pais\":\"Argentina\",\"principal\":true}"
```

### 2. Modificar domicilio

- `PATCH /api/v1/portal/me/domicilios/:domicilioId`

Body: usa el mismo contrato que crear domicilio.

Importante:

- para editar un domicilio tenés que pegarle a la URL con el `domicilioId` real
- no se edita contra `/domicilios/principal`
- `/domicilios/principal` es solamente para marcar cuál domicilio pasa a ser el principal

Ejemplo correcto para editar:

```bash
curl.exe --location --request PATCH "https://api.dev.sanchezantoniolli.com.ar/api/v2/sociosa/api/v1/portal/me/domicilios/550e8400-e29b-41d4-a716-446655440000" ^
  --header "Cookie: sid=TU_SID; trusted_device_token=TU_TRUSTED_DEVICE_TOKEN" ^
  --header "Content-Type: application/json" ^
  --header "x-request-id: portal-update-domicilio-001" ^
  --data "{\"calle\":\"N. Rodriguez Pena\",\"numero\":\"2423\",\"ciudad\":\"Cordoba\",\"provincia\":\"Cordoba\",\"pais\":\"Argentina\"}"
```

Si se invoca por error `PATCH /api/v1/portal/me/domicilios/principal` esperando editar, el backend interpreta otra operación distinta: marcar domicilio principal. En ese caso, el síntoma esperable es un `400` relacionado con `domicilioId must be a UUID`.

### 3. Eliminar domicilio

- `DELETE /api/v1/portal/me/domicilios/:domicilioId`

No requiere body.

### 4. Marcar domicilio principal

- `PATCH /api/v1/portal/me/domicilios/principal`

Importante:

- esta operación no actualiza un domicilio por `id`
- se usa solo para indicar qué domicilio existente pasa a ser el principal
- frontend no debe reutilizar el flujo de edición para este endpoint

Body:

```json
{
  "calle": "Av. Siempre Viva",
  "numero": "123",
  "ciudad": "Cordoba",
  "provincia": "Cordoba",
  "pais": "Argentina"
}
```

### 5. Desmarcar domicilio principal

- `PATCH /api/v1/portal/me/domicilios/principal/unset`

No requiere body.

## Qué hace el BFF internamente

El BFF no persiste estos cambios por sí mismo.

Lo que hace es:

1. validar request, params y body
2. aplicar permisos (`sociosa:write`)
3. reenviar la mutación a `clientes-fsa`

Las rutas downstream usadas son estas:

- `POST /clientes/me/contactos`
- `PATCH /clientes/me/contactos/:contactoId`
- `DELETE /clientes/me/contactos/:contactoId`
- `PATCH /clientes/me/contactos/principal`
- `PATCH /clientes/me/contactos/principal/unset`
- `POST /clientes/me/domicilios`
- `PATCH /clientes/me/domicilios/:domicilioId`
- `DELETE /clientes/me/domicilios/:domicilioId`
- `PATCH /clientes/me/domicilios/principal`
- `PATCH /clientes/me/domicilios/principal/unset`

## Errores esperables

Frontend debería contemplar al menos:

- `400`: payload inválido
- `401`: sesión inválida o vencida
- `403`: usuario sin permiso
- `404`: recurso no encontrado
- `422`: validación de negocio en downstream
- `502` o `504`: error temporal de integración

## Nota Para Frontend

Hay dos tipos de operaciones que no deben mezclarse:

- edición por identificador: `PATCH /contactos/:contactoId` y `PATCH /domicilios/:domicilioId`
- cambio de principal: `PATCH /contactos/principal`, `PATCH /contactos/principal/unset`, `PATCH /domicilios/principal`, `PATCH /domicilios/principal/unset`

Regla práctica:

- si frontend ya tiene el `id` y quiere modificar datos, debe usar la ruta con `:id`
- si frontend quiere marcar o desmarcar el principal, debe usar la ruta `/principal` o `/principal/unset`
- si aparece un `400` del estilo `contactoId must be a UUID` o `domicilioId must be a UUID`, revisar primero que no se esté llamando una ruta de principal como si fuera una ruta de edición

## Recomendaciones para frontend

- centralizar la capa API para estas mutaciones
- reutilizar la sesión activa por cookies en deploy
- reenviar siempre un `x-request-id` si ya existe infraestructura de trazabilidad
- después de una mutación exitosa, reconsultar el perfil para refrescar la UI
- no asumir que un cambio de principal devuelve el objeto actualizado; solo devuelve `{ ok: true }`

## Documentación relacionada

- `docs/frontend-integration.md`
- `docs/postman-session-examples.md`
- `docs/portal-expedientes.md`
- `docs/portal-expediente-actual.md`
