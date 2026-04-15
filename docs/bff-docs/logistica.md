# Logistica en el BFF Cliente

## Objetivo

Se agrego una capa de logistica interna en este BFF para exponer los endpoints de `parent-orders` que ya existen en `cronicos-fsa`, manteniendo el estilo del repositorio:

- controllers delgados
- capa de aplicacion simple
- puertos de dominio
- adapters HTTP para integraciones

El objetivo fue que el BFF pueda consultar `CRONICOS_API_URL` usando los mismos endpoints de logistica ya existentes en el backend de cronicos, sin mezclar logica de negocio propia en el controller.

## Alcance implementado

Se implemento la parte de logistica interna asociada a `parent-orders`.

No se implemento en esta etapa una vista de logistica para el cliente autenticado dentro de `portal/me`.

Tampoco se agrego enriquecimiento adicional desde `CLIENTES_API_URL`, porque para estos endpoints la respuesta de `cronicos-fsa` ya devuelve datos suficientes como:

- `clienteNombreCompleto`
- `clienteDni`
- `assignedSucursalId`
- `orders`

## Arquitectura agregada

Se creo un nuevo modulo independiente de logistica:

- `src/domain/logistica/models/parent-order.model.ts`
- `src/domain/logistica/ports/logistica.port.ts`
- `src/application/logistica/logistica.service.ts`
- `src/application/logistica/logistica.app.module.ts`
- `src/infrastructure/Logistica/adapters/cronicos-logistica.adapter.ts`
- `src/infrastructure/Logistica/controllers/logistica.controller.ts`
- `src/infrastructure/Logistica/dto/logistica.request.dto.ts`
- `src/infrastructure/Logistica/dto/logistica.response.dto.ts`
- `src/infrastructure/Logistica/logistica-infra.module.ts`
- `src/infrastructure/Logistica/logistica.module.ts`

Y se registro en el `AppModule` para que quede disponible junto al resto del BFF.

## Flujo de capas

El flujo de una request es este:

1. Entra por `LogisticaController`.
2. El controller valida params y body con Nest.
3. El controller delega en `LogisticaService`.
4. El servicio usa el puerto `LogisticaPort`.
5. El adapter `CronicosLogisticaAdapter` resuelve la llamada HTTP a `cronicos-fsa`.
6. Se devuelve la respuesta downstream casi sin transformacion, preservando el contrato de cronicos.

Esto sigue la convencion general del proyecto: `domain <- application <- infrastructure`.

## Downstream usado

La implementacion usa el cliente HTTP ya configurado para `CRONICOS_HTTP`, que a su vez toma su `baseURL` desde:

- `CRONICOS_API_URL`

El adapter usa `InjectDownstreamHttp(CRONICOS_HTTP)` para reutilizar autenticacion, audience y retries definidos en el modulo de auth/runtime.

Ademas, cuando llega `x-request-id` en la request, se reenvia al downstream para trazabilidad.

## Autenticacion y permisos

El BFF espera autenticacion via `Authorization: Bearer <jwt>`.

Para estos endpoints de logistica, los permisos efectivos que controla el BFF son los del cliente `sociosa`, igual que en el resto del modulo `portal/me`.

En otras palabras:

- lecturas: `sociosa:read`
- escrituras: `sociosa:write`

Esto es importante porque los endpoints proxyan a `cronicos-fsa`, pero el control de acceso del BFF se resuelve en su propia capa de auth antes de llegar al adapter downstream.

## Endpoints expuestos

Todos quedaron expuestos bajo `/api/v1/logistica`.

## Guia rapida para frontend

Esta seccion esta pensada para que frontend pueda consumir los endpoints sin tener que leer el controller o los DTOs.

### Base URL

En local, con el `.env` actual del BFF:

- `http://localhost:4423/api/v1/logistica`

Si se consume por deploy, la base es:

- `https://<host-del-bff>/api/v1/logistica`

### Headers esperados

Todos los endpoints requieren:

- `Authorization: Bearer <jwt>`

Header recomendado para trazabilidad:

- `x-request-id: <id-unico>`

Headers tipicos:

```http
Authorization: Bearer <token>
x-request-id: front-logistica-001
Content-Type: application/json
Accept: application/json
```

### Permisos

- lectura: `sociosa:read`
- escritura: `sociosa:write`

### Convenciones de respuesta

- los `GET` y los `POST` de lectura devuelven JSON
- los endpoints de update devuelven `204 No Content`
- el endpoint de PDF devuelve `application/pdf`
- los errores siguen el manejo general del BFF y pueden devolver `400`, `401`, `403`, `404`, `422`, `502` o `504`

### Ejemplo base con fetch

```ts
const response = await fetch("http://localhost:4423/api/v1/logistica/MI_ENDPOINT", {
  method: "GET",
  headers: {
    Authorization: `Bearer ${token}`,
    "x-request-id": crypto.randomUUID(),
    Accept: "application/json",
  },
});

if (!response.ok) {
  throw new Error(`Error ${response.status}`);
}

const data = await response.json();
```

### 1. Listar parent orders por ciclo

`GET /api/v1/logistica/:cicloId/parent-orders`

Permiso requerido:

- `sociosa:read`

Valida:

- `cicloId` como UUID

Proxy a:

- `GET /logistica/:cicloId/parent-orders` en `cronicos-fsa`

Como consumirlo desde frontend:

```ts
const cicloId = "11111111-1111-1111-1111-111111111111";

const response = await fetch(
  `http://localhost:4423/api/v1/logistica/${cicloId}/parent-orders`,
  {
    headers: {
      Authorization: `Bearer ${token}`,
      "x-request-id": crypto.randomUUID(),
      Accept: "application/json",
    },
  },
);

const parentOrders = await response.json();
```

Curl:

```bash
curl.exe -X GET "http://localhost:4423/api/v1/logistica/11111111-1111-1111-1111-111111111111/parent-orders" ^
  -H "Authorization: Bearer TU_TOKEN" ^
  -H "x-request-id: logistica-parent-orders-001"
```

Respuesta esperada:

- array de `ParentOrderResponseDto`

Campos utiles para frontend:

- `id`
- `code`
- `status`
- `billingStatus`
- `clienteNombreCompleto`
- `clienteDni`
- `assignedSucursalId`
- `hasSucursalConflict`
- `orders`

### 2. Listar parent orders por sucursal autenticada

`GET /api/v1/logistica/parent-orders/sucursal`

Permiso requerido:

- `sociosa:read`

Proxy a:

- `GET /logistica/parent-orders/sucursal`

La respuesta viene agrupada por estado:

- `accepted`
- `confirmed`
- `inPreparation`
- `partiallyPrepared`
- `prepared`
- `inTransit`
- `delivered`
- `cancelled`

Como consumirlo desde frontend:

```ts
const response = await fetch(
  "http://localhost:4423/api/v1/logistica/parent-orders/sucursal",
  {
    headers: {
      Authorization: `Bearer ${token}`,
      "x-request-id": crypto.randomUUID(),
      Accept: "application/json",
    },
  },
);

const grouped = await response.json();
```

Curl:

```bash
curl.exe -X GET "http://localhost:4423/api/v1/logistica/parent-orders/sucursal" ^
  -H "Authorization: Bearer TU_TOKEN" ^
  -H "x-request-id: logistica-sucursal-001"
```

Respuesta esperada:

```json
{
  "accepted": [],
  "confirmed": [],
  "inPreparation": [],
  "partiallyPrepared": [],
  "prepared": [],
  "inTransit": [],
  "delivered": [],
  "cancelled": []
}
```

Uso tipico en frontend:

- dashboard por columnas o tabs segun estado
- contadores por estado
- tabla agrupada

### 3. Obtener parent order por codigo

`GET /api/v1/logistica/parent-orders/:code`

Permiso requerido:

- `sociosa:read`

Proxy a:

- `GET /logistica/parent-orders/:code`

Como consumirlo desde frontend:

```ts
const code = "123-456";

const response = await fetch(
  `http://localhost:4423/api/v1/logistica/parent-orders/${code}`,
  {
    headers: {
      Authorization: `Bearer ${token}`,
      "x-request-id": crypto.randomUUID(),
      Accept: "application/json",
    },
  },
);

const parentOrder = await response.json();
```

Curl:

```bash
curl.exe -X GET "http://localhost:4423/api/v1/logistica/parent-orders/123-456" ^
  -H "Authorization: Bearer TU_TOKEN" ^
  -H "x-request-id: logistica-by-code-001"
```

Respuesta esperada:

- un `ParentOrderResponseDto`

Uso tipico en frontend:

- detalle de una parent order
- pantalla de seguimiento por codigo

### 4. Descargar nota de pedido PDF

`GET /api/v1/logistica/parent-orders/:parentOrderId/nota-pedido.pdf`

Permiso requerido:

- `sociosa:read`

Valida:

- `parentOrderId` como UUID

Proxy a:

- `GET /logistica/parent-orders/:parentOrderId/nota-pedido.pdf`

Comportamiento especial:

- usa `responseType: arraybuffer`
- devuelve `StreamableFile`
- preserva `Content-Type: application/pdf`
- intenta extraer el filename desde `content-disposition`

Como consumirlo desde frontend:

```ts
const parentOrderId = "11111111-1111-1111-1111-111111111111";

const response = await fetch(
  `http://localhost:4423/api/v1/logistica/parent-orders/${parentOrderId}/nota-pedido.pdf`,
  {
    headers: {
      Authorization: `Bearer ${token}`,
      "x-request-id": crypto.randomUUID(),
      Accept: "application/pdf",
    },
  },
);

if (!response.ok) throw new Error(`Error ${response.status}`);

const blob = await response.blob();
const url = URL.createObjectURL(blob);
window.open(url, "_blank");
```

Curl:

```bash
curl.exe -X GET "http://localhost:4423/api/v1/logistica/parent-orders/11111111-1111-1111-1111-111111111111/nota-pedido.pdf" ^
  -H "Authorization: Bearer TU_TOKEN" ^
  -H "x-request-id: logistica-pdf-001" ^
  --output nota-pedido.pdf
```

Respuesta esperada:

- binario PDF

Uso tipico en frontend:

- descargar comprobante
- abrir PDF en una nueva tab

### 5. Crear o recuperar draft por ciclo

`POST /api/v1/logistica/:cicloId/parent-orders/draft`

Permiso requerido:

- `sociosa:write`

Valida:

- `cicloId` como UUID

Proxy a:

- `POST /logistica/:cicloId/parent-orders/draft`

Respuesta esperada:

```json
{
  "parentOrderId": "uuid",
  "code": "123-456",
  "created": true
}
```

Como consumirlo desde frontend:

```ts
const cicloId = "11111111-1111-1111-1111-111111111111";

const response = await fetch(
  `http://localhost:4423/api/v1/logistica/${cicloId}/parent-orders/draft`,
  {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "x-request-id": crypto.randomUUID(),
      Accept: "application/json",
    },
  },
);

const draft = await response.json();
```

Curl:

```bash
curl.exe -X POST "http://localhost:4423/api/v1/logistica/11111111-1111-1111-1111-111111111111/parent-orders/draft" ^
  -H "Authorization: Bearer TU_TOKEN" ^
  -H "x-request-id: logistica-draft-001"
```

Respuesta esperada:

```json
{
  "parentOrderId": "uuid",
  "code": "123-456",
  "created": true
}
```

Lectura de `created`:

- `true`: se creo un draft nuevo
- `false`: ya existia y se devolvio el existente

### 6. Actualizar estado de preparacion

`POST /api/v1/logistica/parent-orders/:parentOrderId/status`

Permiso requerido:

- `sociosa:write`

Valida:

- `parentOrderId` como UUID
- body con `UpdateParentOrderStatusRequestDto`

Body:

```json
{
  "status": "PREPARED",
  "collaboratorLegajo": "1234",
  "preparedOrderIds": ["10001", "10002"]
}
```

Reglas de validacion locales:

- `status` solo acepta `IN_PREPARATION`, `PARTIALLY_PREPARED` o `PREPARED`
- `collaboratorLegajo` debe ser numerico de 1 a 4 digitos
- `preparedOrderIds` es opcional y debe ser array de strings

Proxy a:

- `POST /logistica/parent-orders/:parentOrderId/status`

Como consumirlo desde frontend:

```ts
const parentOrderId = "11111111-1111-1111-1111-111111111111";

await fetch(
  `http://localhost:4423/api/v1/logistica/parent-orders/${parentOrderId}/status`,
  {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "x-request-id": crypto.randomUUID(),
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      status: "PREPARED",
      collaboratorLegajo: "1234",
      preparedOrderIds: ["10001", "10002"],
    }),
  },
);
```

Curl:

```bash
curl.exe -X POST "http://localhost:4423/api/v1/logistica/parent-orders/11111111-1111-1111-1111-111111111111/status" ^
  -H "Authorization: Bearer TU_TOKEN" ^
  -H "x-request-id: logistica-status-001" ^
  -H "Content-Type: application/json" ^
  -d "{\"status\":\"PREPARED\",\"collaboratorLegajo\":\"1234\",\"preparedOrderIds\":[\"10001\",\"10002\"]}"
```

Respuesta esperada:

- `204 No Content`

Interpretacion para frontend:

- si responde `204`, el update salio bien
- no hay body de respuesta
- luego conviene volver a consultar la parent order o el listado

### 7. Actualizar billing status

`POST /api/v1/logistica/parent-orders/:parentOrderId/billing-status`

Permiso requerido:

- `sociosa:write`

Valida:

- `parentOrderId` como UUID

Body:

```json
{
  "billingStatus": "BILLED",
  "reason": "optional"
}
```

Proxy a:

- `POST /logistica/parent-orders/:parentOrderId/billing-status`

Nota:

En Swagger del BFF este endpoint esta marcado con `ApiExcludeEndpoint`, igual que en cronicos, porque es mas bien de uso interno.

Como consumirlo desde frontend:

```ts
const parentOrderId = "11111111-1111-1111-1111-111111111111";

await fetch(
  `http://localhost:4423/api/v1/logistica/parent-orders/${parentOrderId}/billing-status`,
  {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "x-request-id": crypto.randomUUID(),
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      billingStatus: "BILLED",
      reason: "optional",
    }),
  },
);
```

Curl:

```bash
curl.exe -X POST "http://localhost:4423/api/v1/logistica/parent-orders/11111111-1111-1111-1111-111111111111/billing-status" ^
  -H "Authorization: Bearer TU_TOKEN" ^
  -H "x-request-id: logistica-billing-001" ^
  -H "Content-Type: application/json" ^
  -d "{\"billingStatus\":\"BILLED\",\"reason\":\"optional\"}"
```

Respuesta esperada:

- `204 No Content`

Nota para frontend:

- aunque el endpoint existe en el BFF, hoy esta pensado mas como endpoint interno
- si se usa desde UI, conviene validar primero si efectivamente debe quedar expuesto en producto

### 8. Listar summary por ciclo

`GET /api/v1/logistica/:cicloId/parent-orders/summary`

Permiso requerido:

- `sociosa:read`

Valida:

- `cicloId` como UUID

Proxy a:

- `GET /logistica/:cicloId/parent-orders/summary`

Como consumirlo desde frontend:

```ts
const cicloId = "11111111-1111-1111-1111-111111111111";

const response = await fetch(
  `http://localhost:4423/api/v1/logistica/${cicloId}/parent-orders/summary`,
  {
    headers: {
      Authorization: `Bearer ${token}`,
      "x-request-id": crypto.randomUUID(),
      Accept: "application/json",
    },
  },
);

const summary = await response.json();
```

Curl:

```bash
curl.exe -X GET "http://localhost:4423/api/v1/logistica/11111111-1111-1111-1111-111111111111/parent-orders/summary" ^
  -H "Authorization: Bearer TU_TOKEN" ^
  -H "x-request-id: logistica-summary-ciclo-001"
```

Respuesta esperada:

- array de `ParentOrderSummaryDto`

Campos:

- `id`
- `code`
- `codeActive`
- `clienteId`
- `cicloId`
- `status`

Uso tipico en frontend:

- listados livianos
- tablas resumidas
- selección rápida antes de pedir el detalle completo

### 9. Listar summary para multiples ciclos

`POST /api/v1/logistica/parent-orders/summary`

Permiso requerido:

- `sociosa:read`

Body:

```json
{
  "cicloIds": [
    "11111111-1111-1111-1111-111111111111",
    "22222222-2222-2222-2222-222222222222"
  ]
}
```

Validacion local:

- `cicloIds` debe ser array no vacio
- cada valor debe ser UUID v4

Proxy a:

- `POST /logistica/parent-orders/summary`

Como consumirlo desde frontend:

```ts
const response = await fetch(
  "http://localhost:4423/api/v1/logistica/parent-orders/summary",
  {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "x-request-id": crypto.randomUUID(),
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      cicloIds: [
        "11111111-1111-1111-1111-111111111111",
        "22222222-2222-2222-2222-222222222222",
      ],
    }),
  },
);

const summary = await response.json();
```

Curl:

```bash
curl.exe -X POST "http://localhost:4423/api/v1/logistica/parent-orders/summary" ^
  -H "Authorization: Bearer TU_TOKEN" ^
  -H "x-request-id: logistica-summary-multi-001" ^
  -H "Content-Type: application/json" ^
  -d "{\"cicloIds\":[\"11111111-1111-1111-1111-111111111111\",\"22222222-2222-2222-2222-222222222222\"]}"
```

Respuesta esperada:

- array de `ParentOrderSummaryDto`

Uso tipico en frontend:

- vista consolidada para varios ciclos
- precarga de resumenes para dashboard

## Contratos principales

### ParentOrderResponseDto

La entidad principal expuesta por los endpoints contiene, entre otros, estos campos:

- `id`
- `code`
- `codeActive`
- `cicloId`
- `clienteId`
- `clienteNombreCompleto`
- `clienteDni`
- `assignedSucursalId`
- `hasSucursalConflict`
- `status`
- `billingStatus`
- `deliveryMode`
- `medioEntrega`
- `medioPago`
- `entregaDestino`
- `entregaSucursal`
- `entregaDomicilio`
- `orders`

### Child orders

Cada `ParentOrderResponseDto` contiene `orders`, que representa los pedidos hijos asociados. Cada item puede incluir:

- `nroPedido`
- `prepared`
- `pedidoIdSucursal`
- `pedidoTipoEntrega`
- `pedidoTipoPago`
- `pedidoEstadoDescripcion`
- `pedidoFechaEstado`
- `pedidoOperador`
- `products`
- `movements`

### Summary

Para listados livianos se expone `ParentOrderSummaryDto` con:

- `id`
- `code`
- `codeActive`
- `clienteId`
- `cicloId`
- `status`

## Manejo de errores

El adapter mapea errores HTTP del downstream con un criterio similar al ya usado en otras integraciones del BFF:

- `400` -> `Bad Request`
- `401` -> `Unauthorized`
- `403` -> `Forbidden`
- `404` -> `Not Found`
- `422` -> `Unprocessable Entity`
- `5xx` -> `BadGatewayException`
- sin status o error de red -> `GatewayTimeoutException`

Mensaje usado para errores de infraestructura:

- `Dependencia cronicos-fsa no disponible`
- `Timeout o error de red al consultar logistica en cronicos-fsa`

## Decisiones tecnicas

### Se mantuvo el contrato de cronicos

No se hizo una transformacion fuerte de la respuesta. La idea fue preservar los mismos endpoints y shapes ya existentes en `cronicos-fsa` para reducir riesgo y facilitar integracion.

### Se uso un adapter dedicado

En vez de llamar HTTP directamente desde el controller, se creo `CronicosLogisticaAdapter` para:

- centralizar headers
- centralizar mapeo de errores
- separar infraestructura de controller y servicio

### Se reutilizo la configuracion de authz/downstreams

No se creo un cliente HTTP nuevo manualmente. Se reutilizo el runtime ya configurado en el BFF para `CRONICOS_HTTP`.

## Lo que no se hizo

Quedaron fuera de este cambio:

- tests e2e para logistica
- mocks dedicados para logistica
- enriquecimiento adicional desde `CLIENTES_API_URL`
- integracion de estos endpoints con una UI dentro de este repo

## Como probar rapido

### Desde Swagger

1. Levantar el BFF.
2. Abrir `/docs`.
3. Autenticarse con bearer token valido.
4. Probar los endpoints `logistica`.

### Desde curl

```bash
curl -X GET "http://localhost:4423/api/v1/logistica/11111111-1111-1111-1111-111111111111/parent-orders" \
  -H "Authorization: Bearer TU_TOKEN" \
  -H "x-request-id: test-logistica-001"
```

## Recomendaciones para frontend

- Para `GET` de listados o detalle, trabajar siempre contra JSON y validar `response.ok`.
- Para endpoints `204`, no intentar hacer `response.json()`.
- Para PDF, usar `blob()`.
- Reconsultar el detalle o listado despues de un update de estado o billing status.
- Si se construye una capa API del front, conviene centralizar:
  - base URL
  - bearer token
  - `x-request-id`
  - manejo uniforme de errores HTTP

## Resumen corto de endpoints

| Endpoint | Metodo | Uso principal | Respuesta |
|---|---|---|---|
| `/api/v1/logistica/:cicloId/parent-orders` | `GET` | Listar parent orders por ciclo | `ParentOrderResponseDto[]` |
| `/api/v1/logistica/parent-orders/sucursal` | `GET` | Listar parent orders por estado | `ParentOrdersByStatusResponseDto` |
| `/api/v1/logistica/parent-orders/:code` | `GET` | Obtener detalle por codigo | `ParentOrderResponseDto` |
| `/api/v1/logistica/parent-orders/:parentOrderId/nota-pedido.pdf` | `GET` | Descargar PDF | `application/pdf` |
| `/api/v1/logistica/:cicloId/parent-orders/draft` | `POST` | Crear o recuperar draft | `EnsureParentOrderDraftResponseDto` |
| `/api/v1/logistica/parent-orders/:parentOrderId/status` | `POST` | Actualizar estado de preparacion | `204` |
| `/api/v1/logistica/parent-orders/:parentOrderId/billing-status` | `POST` | Actualizar billing status | `204` |
| `/api/v1/logistica/:cicloId/parent-orders/summary` | `GET` | Listado resumido por ciclo | `ParentOrderSummaryDto[]` |
| `/api/v1/logistica/parent-orders/summary` | `POST` | Listado resumido multi ciclo | `ParentOrderSummaryDto[]` |

```bash
curl -X POST "http://localhost:3000/v1/logistica/parent-orders/summary" \
  -H "Authorization: Bearer TU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "cicloIds": [
      "11111111-1111-1111-1111-111111111111",
      "22222222-2222-2222-2222-222222222222"
    ]
  }'
```

## Archivos clave para leer

- `src/infrastructure/Logistica/controllers/logistica.controller.ts`
- `src/infrastructure/Logistica/adapters/cronicos-logistica.adapter.ts`
- `src/application/logistica/logistica.service.ts`
- `src/domain/logistica/ports/logistica.port.ts`
- `src/infrastructure/Logistica/dto/logistica.request.dto.ts`
- `src/infrastructure/Logistica/dto/logistica.response.dto.ts`
- `src/shared/auth/auth.module.ts`

## Resumen corto

La implementacion de logistica en este BFF agrega una fachada REST para los endpoints internos de `parent-orders` ya existentes en `cronicos-fsa`, usando `CRONICOS_API_URL`, manteniendo la arquitectura por capas del proyecto y dejando preparado el terreno para sumar tests o enriquecimiento adicional mas adelante.