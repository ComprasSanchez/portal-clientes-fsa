# Portal Expedientes

## Objetivo

Este documento explica cómo consumir desde frontend el endpoint:

- `GET /api/v1/portal/me/expedientes`

Incluye:

- URL
- headers
- query params
- ejemplo `fetch`
- ejemplo `curl`
- shape de respuesta
- nuevo enriquecimiento con `cicloActual` y `ciclosPasados`
- dependencia de permisos involucrada en el enriquecimiento

## Endpoint

Ruta BFF:

- `GET /api/v1/portal/me/expedientes`

En local, con el `.env` actual del BFF:

- `http://localhost:4423/api/v1/portal/me/expedientes`

En deploy:

- `https://<host-del-bff>/api/v1/portal/me/expedientes`

## Autenticacion

El endpoint requiere:

- `Authorization: Bearer <jwt>`

Y acepta opcionalmente:

- `x-request-id`

Headers recomendados:

```http
Authorization: Bearer <token>
x-request-id: portal-expedientes-001
Accept: application/json
```

Permiso requerido:

- `sociosa:read`

## Query params soportados

Todos son opcionales.

- `accountKind=CLIENTE|COLABORADOR`
- `limit`
- `offset`
- `page`

Notas:

- hoy el adapter usa `limit` y `offset` para pedir expedientes a cronicos
- `page` existe en el contrato general de secciones, pero para expedientes el paging efectivo es por `offset` y `limit`
- si frontend ya trabaja con paginado clásico, conviene usar:
  - `limit`
  - `offset = pageIndex * limit`

Ejemplo:

```text
/api/v1/portal/me/expedientes?accountKind=CLIENTE&limit=20&offset=0
```

## Ejemplo con fetch

```ts
const token = "TU_TOKEN";

const params = new URLSearchParams({
  accountKind: "CLIENTE",
  limit: "20",
  offset: "0",
});

const response = await fetch(
  `http://localhost:4423/api/v1/portal/me/expedientes?${params.toString()}`,
  {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "x-request-id": crypto.randomUUID(),
      Accept: "application/json",
    },
  },
);

if (!response.ok) {
  throw new Error(`Error ${response.status}`);
}

const data = await response.json();
```

## Ejemplo con curl

PowerShell:

```bash
curl.exe -X GET "http://localhost:4423/api/v1/portal/me/expedientes?accountKind=CLIENTE&limit=20&offset=0" ^
  -H "Authorization: Bearer TU_TOKEN" ^
  -H "x-request-id: portal-expedientes-001"
```

Bash:

```bash
curl -X GET "http://localhost:4423/api/v1/portal/me/expedientes?accountKind=CLIENTE&limit=20&offset=0" \
  -H "Authorization: Bearer TU_TOKEN" \
  -H "x-request-id: portal-expedientes-001"
```

## Respuesta general

La respuesta sigue este contrato:

```json
{
  "schemaVersion": "v1",
  "generatedAt": "2026-04-15T14:41:59.081Z",
  "partial": false,
  "warnings": [],
  "data": {
    "clienteId": "uuid",
    "resumen": {
      "total": 58,
      "activos": 20,
      "cerrados": 38
    },
    "items": [],
    "page": {
      "offset": 0,
      "limit": 20,
      "hasMore": true
    }
  }
}
```

## Significado de los campos de nivel superior

- `schemaVersion`: version del contrato
- `generatedAt`: timestamp ISO de armado de la respuesta
- `partial`: indica si hubo alguna fuente secundaria que fallo pero igual se devolvieron datos
- `warnings`: lista de warnings tecnicos o funcionales

## Resumen

`data.resumen` contiene:

- `total`: total de expedientes encontrados
- `activos`: cantidad de expedientes activos
- `cerrados`: total menos activos

La lógica actual considera activo un expediente cuyo `estado` contenga algo como:

- `ACT`
- `ABIER`

## Items

Cada item de `data.items` ahora puede incluir:

- datos base del expediente
- `cicloActual`
- `ciclosPasados`

### Shape de cada item

```json
{
  "expedienteId": "uuid",
  "estado": "ACTIVO",
  "categoria": "optional",
  "openedAt": "2026-04-08",
  "updatedAt": "2026-04-09T10:09:40-03:00",
  "nextActionAt": "2026-04-20",
  "cicloActual": {
    "cicloId": "uuid",
    "numeroCiclo": 12,
    "titulo": "Ciclo 12",
    "estado": "EN_GESTION",
    "fechaInicioCiclo": "2026-04-01",
    "fechaEntregaObjetivo": "2026-04-15",
    "fechaInicioGestion": "2026-03-28",
    "updatedAt": "2026-04-09T10:09:40-03:00"
  },
  "ciclosPasados": [
    {
      "cicloId": "uuid-anterior",
      "numeroCiclo": 11,
      "titulo": "Ciclo 11",
      "estado": "COMPLETADO",
      "fechaInicioCiclo": "2026-03-01",
      "fechaEntregaObjetivo": "2026-03-15",
      "fechaInicioGestion": "2026-02-25",
      "updatedAt": "2026-03-15T11:00:00-03:00"
    }
  ]
}
```

## Como se calcula `cicloActual`

El BFF busca los ciclos del expediente en `cronicos-fsa` y elige:

1. el primero con estado `PENDIENTE` o `EN_GESTION`
2. si no existe uno activo, toma el primero de la lista devuelta por cronicos

## Como se calcula `ciclosPasados`

- es el resto de los ciclos del expediente
- excluye el `cicloActual`
- puede venir vacío o no venir si no hay ciclos

## De donde sale la informacion

El BFF arma esta respuesta a partir de dos fuentes en `cronicos-fsa`:

1. `/expedientes`
   de ahi salen:
   - `expedienteId`
   - `estado`
   - `openedAt`
   - `updatedAt`
   - `nextActionAt`

2. `/expedientes/:expedienteId/detalle`
   de ahi salen:
   - `cicloActual`
   - `ciclosPasados`

Notas importantes:

- el BFF ya no consume `/agenda/expedientes/:expedienteId/ciclos`
- `cicloActual` se arma desde `detalle.cicloActual.ciclo`
- `ciclosPasados` se arma desde `detalle.ciclosPasados`
- para evitar rechazos parciales, el BFF resuelve los detalles de expediente en lotes chicos y no todos al mismo tiempo

## Dependencia de permisos

Para llamar al endpoint del BFF sigue alcanzando con:

- `sociosa:read`

Pero el enriquecimiento de ciclos depende de una llamada interna a `cronicos-fsa /expedientes/:id/detalle`.

Durante la investigacion vimos que ese detalle, a su vez, resuelve informacion de cliente en `clientes-fsa`, por lo que el bearer del usuario tambien necesita poder leer cliente por id.

En la practica, para que el enriquecimiento funcione completo sin `warnings`, el usuario termino necesitando:

- `sociosa:read`
- `clientes-fsa -> cliente:read`

Si falta `cliente:read`, puede pasar esto:

- el listado base de expedientes responde bien
- el detalle por expediente es rechazado aguas abajo
- el BFF devuelve `partial: true`
- aparece `expediente_cycles_unavailable`

## Comportamiento ante fallos parciales

Si falla la consulta de ciclos para uno o mas expedientes:

- el endpoint no necesariamente falla completo
- puede devolver la lista base de expedientes
- `partial` pasa a `true`
- en `warnings` puede aparecer:
  - `expediente_cycles_unavailable`

En ese caso frontend deberia:

- seguir renderizando el expediente base
- tratar `cicloActual` y `ciclosPasados` como opcionales

## Recomendacion para frontend

Frontend deberia asumir siempre que:

- `cicloActual` es opcional
- `ciclosPasados` puede no venir o venir vacio
- `partial` y `warnings` son parte del contrato y pueden indicar que el expediente base vino bien pero el enriquecimiento no

## Recomendacion de tipado en frontend

Ejemplo sugerido:

```ts
type PortalExpedienteCycle = {
  cicloId: string;
  numeroCiclo: number;
  titulo: string;
  estado: string;
  fechaInicioCiclo: string;
  fechaEntregaObjetivo: string;
  fechaInicioGestion: string;
  updatedAt: string;
};

type PortalExpedienteItem = {
  expedienteId: string;
  estado: string;
  categoria?: string;
  openedAt?: string;
  updatedAt?: string;
  nextActionAt?: string;
  cicloActual?: PortalExpedienteCycle;
  ciclosPasados?: PortalExpedienteCycle[];
};

type PortalExpedientesResponse = {
  schemaVersion: "v1";
  generatedAt: string;
  partial: boolean;
  warnings: string[];
  data: {
    clienteId: string;
    resumen: {
      total: number;
      activos: number;
      cerrados: number;
    };
    items: PortalExpedienteItem[];
    page: {
      offset: number;
      limit: number;
      hasMore: boolean;
    };
  };
};
```

## Recomendaciones para UI

- tratar `cicloActual` como opcional
- tratar `ciclosPasados` como opcional
- si `partial === true`, no bloquear la pantalla completa
- mostrar fallback visual cuando falte info de ciclos
- no asumir que `ciclosPasados` siempre tiene elementos

Ejemplos de fallback razonables:

- `cicloActual`: `Sin ciclo actual`
- `ciclosPasados`: `Sin historial de ciclos`

## Ejemplo de lectura en frontend

```ts
const expediente = data.data.items[0];

const tituloCicloActual = expediente.cicloActual?.titulo ?? "Sin ciclo actual";
const fechaObjetivo = expediente.cicloActual?.fechaEntregaObjetivo ?? null;
const cantidadCiclosPasados = expediente.ciclosPasados?.length ?? 0;
```

## Casos utiles de uso en frontend

Con este contrato ya se puede construir:

- card de expediente con estado actual
- badge de ciclo actual
- timeline simple de ciclos pasados
- CTA a detalle del ciclo actual
- contador de historial por expediente

## Errores esperables

El endpoint puede responder con:

- `400`
- `401`
- `403`
- `404`
- `422`
- `502`
- `504`

Frontend deberia manejar al menos:

- `401`: sesión/token inválido
- `403`: usuario sin permiso o sin vínculo
- `5xx`: error temporal del backend

## Resumen corto

`GET /portal/me/expedientes` ahora devuelve:

- resumen de expedientes
- items paginados
- por cada expediente:
  - info base
  - `cicloActual`
  - `ciclosPasados`

Esto permite que frontend resuelva una vista de expedientes mucho más útil sin tener que pegarle por separado a cronicos para cada expediente.