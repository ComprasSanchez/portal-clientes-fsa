# Portal Compras / Facturacion

Este documento describe como debe consumir el **frontend** el endpoint de compras del portal, que hoy devuelve informacion de facturacion obtenida desde Plex.

Base URL: `{BFF_URL}/api/v1`

> El frontend **no tiene que enviar el DNI**. El BFF obtiene el cliente autenticado desde el token, consulta `/clientes/me`, resuelve el DNI y despues busca la facturacion en Plex.

## Endpoint

```http
GET /api/v1/portal/me/compras
```

## Headers requeridos

```http
Authorization: Bearer <token>
Accept: application/json
```

Header recomendado:

```http
x-request-id: front-compras-001
```

## Query params

| Param | Tipo | Requerido | Default | Descripcion |
| ----- | ---- | --------- | ------- | ----------- |
| `accountKind` | `CLIENTE` \| `COLABORADOR` | No | `CLIENTE` | Tipo de cuenta que usa el BFF al consultar `/clientes/me` |
| `limit` | `number` | No | `20` | Cantidad maxima de filas a devolver |
| `offset` | `number` | No | `0` | Desplazamiento para paginacion |
| `page` | `number` | No | - | Actualmente no se usa para compras; usar `limit` y `offset` |

## Que informacion devuelve

La respuesta mantiene el envelope comun del portal:

```json
{
  "schemaVersion": "v1",
  "generatedAt": "2026-04-20T15:00:00.000Z",
  "partial": false,
  "warnings": [],
  "data": {
    "clienteId": "uuid-del-cliente",
    "resumen": {
      "totalCompras": 4,
      "montoAcumulado": 59093.4,
      "moneda": "ARS"
    },
    "items": [],
    "page": {
      "offset": 0,
      "limit": 10,
      "hasMore": false
    }
  }
}
```

### `data.resumen`

| Campo | Tipo | Descripcion |
| ----- | ---- | ----------- |
| `totalCompras` | `number` | Cantidad de comprobantes distintos encontrados |
| `montoAcumulado` | `number` | Suma total de los comprobantes encontrados |
| `moneda` | `string` | Hoy siempre `ARS` |

### `data.items`

`items` devuelve **detalle por linea de facturacion**, no solo resumen por comprobante.

Cada item puede incluir:

| Campo | Tipo | Descripcion |
| ----- | ---- | ----------- |
| `cliente` | `string` | Nombre del cliente en Plex |
| `telefono` | `string` | Telefono asociado al cliente |
| `dni` | `string` | Documento usado para buscar la facturacion |
| `compraId` | `string` | ID del comprobante, normalizado como string |
| `fecha` | `string` | Fecha/hora de emision en formato string |
| `emision` | `string` | Mismo valor de emision que devuelve Plex |
| `hora` | `string` | Hora del comprobante |
| `estado` | `string` | Hoy siempre `FACTURADA` |
| `tipo` | `string` | Tipo de comprobante, por ejemplo `FV` |
| `letra` | `string` | Letra del comprobante |
| `puntoVta` | `number` \| `string` | Punto de venta |
| `numero` | `number` \| `string` | Numero del comprobante |
| `idComprobante` | `number` \| `string` | ID interno del comprobante en Plex |
| `sucursal` | `number` \| `string` | Sucursal del comprobante |
| `nombreFantasia` | `string` | Nombre fantasia de la sucursal |
| `producto` | `string` | Producto o detalle de la linea |
| `cantidad` | `number` | Cantidad de esa linea |
| `total` | `number` | Total de esa linea |
| `moneda` | `string` | Hoy siempre `ARS` |
| `comprobanteRef` | `string` | Referencia armada por el BFF, por ejemplo `FV B 87-500210` |

## Ejemplo de respuesta realista

```json
{
  "schemaVersion": "v1",
  "generatedAt": "2026-04-20T15:00:00.000Z",
  "partial": false,
  "warnings": [],
  "data": {
    "clienteId": "1d0d1903-0ca3-426e-81f4-dd0630f3ff36",
    "resumen": {
      "totalCompras": 4,
      "montoAcumulado": 59093.4,
      "moneda": "ARS"
    },
    "items": [
      {
        "cliente": "SCOZZARI, GRACIELA FRANCISCA",
        "telefono": "5493514932496",
        "dni": "5721401",
        "compraId": "19895954",
        "fecha": "2026-04-15T03:00:00.000Z",
        "emision": "2026-04-15T03:00:00.000Z",
        "hora": "09:39:15",
        "estado": "FACTURADA",
        "tipo": "FV",
        "letra": "B",
        "puntoVta": 87,
        "numero": 500210,
        "idComprobante": 19895954,
        "sucursal": 5,
        "nombreFantasia": "S. ANTONIOLLI V",
        "producto": "NEURYL 0.5 0.5 mg comp.x 60",
        "cantidad": 1,
        "total": 21047.3,
        "moneda": "ARS",
        "comprobanteRef": "FV B 87-500210"
      }
    ],
    "page": {
      "offset": 0,
      "limit": 10,
      "hasMore": false
    }
  }
}
```

## Como interpretarlo en frontend

- `resumen.totalCompras` cuenta comprobantes distintos.
- `items` puede traer **varias filas con el mismo `compraId`** porque cada fila representa una linea de detalle.
- Si la UI necesita agrupar por comprobante, debe agrupar por `compraId` o por `idComprobante`.
- Si la UI necesita mostrar el detalle de productos, puede renderizar `items` directamente sin volver a consultar nada.

## Recomendacion de uso en UI

### Vista resumida por comprobante

Si la pantalla muestra una tarjeta por factura:

- agrupar `items` por `compraId`
- usar `comprobanteRef`, `fecha`, `nombreFantasia` y la suma de `total`

### Vista detalle

Si la pantalla muestra lineas de productos:

- renderizar cada item tal como viene
- usar `producto`, `cantidad` y `total`

## Errores comunes

| Status | Descripcion |
| ------ | ----------- |
| `400` | Query params invalidos |
| `401` | Token ausente, invalido o expirado |
| `403` | El usuario autenticado no tiene vinculo valido con cliente |
| `502` | No se pudo consultar una dependencia necesaria |
| `504` | Timeout o error de red al resolver datos del cliente |

## Notas importantes

- No enviar `clienteId` ni `dni` desde frontend.
- `page` hoy no aplica para compras; usar `limit` y `offset`.
- `items` esta pensado para no perder informacion de Plex. Si antes frontend asumia una fila por comprobante, ahora debe agrupar.
- `moneda` hoy esta fija en `ARS`.
