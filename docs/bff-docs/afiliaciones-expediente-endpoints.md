# Endpoints para afiliaciones (flujo Expediente)

Este documento describe los endpoints que el **frontend** debe consumir para gestionar afiliaciones de un cliente autenticado.

Base URL: `{BFF_URL}/api/v1`

> Todos los endpoints requieren token Bearer. El BFF resuelve el `clienteId` a partir del token — **no hay que pasar el id del cliente** en la URL.

## Flujo general

1. Buscar obras sociales y planes del catalogo.
2. Crear la afiliacion con la obra social y el plan seleccionados.
3. Opcionalmente marcar o desmarcar la afiliacion como principal.

---

## 1. Catalogo de obras sociales y planes

### Endpoint BFF

```
GET /api/v1/portal/me/obras-sociales
```

### Query params

| Param   | Tipo     | Requerido | Descripcion                                   |
|---------|----------|-----------|-----------------------------------------------|
| `term`  | `string` | No        | Texto libre para filtrar por nombre           |
| `limit` | `number` | No        | Maximo de resultados a devolver (default: 20) |

### Headers requeridos

```
Authorization: Bearer <token>
```

### Respuesta exitosa `200`

```json
{
  "items": [
    {
      "id": "osde",
      "nombre": "OSDE",
      "planes": [
        { "id": "plan-210", "nombre": "Plan 210" },
        { "id": "plan-310", "nombre": "Plan 310" }
      ]
    }
  ]
}
```

---

## 2. Alta de afiliacion

### Endpoint BFF

```
POST /api/v1/portal/me/afiliaciones
```

### Headers requeridos

```
Authorization: Bearer <token>
Content-Type: application/json
```

### Query params opcionales

| Param         | Tipo                       | Descripcion                              |
|---------------|----------------------------|------------------------------------------|
| `accountKind` | `CLIENTE` \| `COLABORADOR` | Tipo de cuenta a mutar (default: ninguno)|

### Body

Todos los campos de tipo `string` con longitud minima 1.

```json
{
  "obraSocialId": "osde",
  "planId": "plan-210",
  "nroAfiliado": "123456",
  "desde": "2026-01-01",
  "hasta": null,
  "notas": null,
  "vigente": true,
  "titular": true,
  "principal": false
}
```

| Campo          | Tipo              | Requerido | Descripcion                                |
|----------------|-------------------|-----------|--------------------------------------------|
| `obraSocialId` | `string` (1-120)  | Si        | ID de la obra social del catalogo          |
| `planId`       | `string` (1-120)  | No        | ID del plan dentro de la obra social       |
| `nroAfiliado`  | `string` (1-120)  | No        | Numero de afiliado                         |
| `desde`        | `string` ISO 8601 | No        | Fecha de inicio de la afiliacion o `null`  |
| `hasta`        | `string` ISO 8601 | No        | Fecha de fin de la afiliacion o `null`     |
| `notas`        | `string` (1-500)  | No        | Notas adicionales o `null`                 |
| `vigente`      | `boolean`         | Si        | Si la afiliacion esta actualmente vigente  |
| `titular`      | `boolean`         | Si        | Si el cliente es el titular               |
| `principal`    | `boolean`         | Si        | Si es la afiliacion principal del cliente  |

### Respuesta exitosa `200`

```json
{ "ok": true }
```

---

## 3. Marcar afiliacion principal

### Endpoint BFF

```
PATCH /api/v1/portal/me/afiliaciones/principal
```

### Headers requeridos

```
Authorization: Bearer <token>
Content-Type: application/json
```

### Body

```json
{
  "obraSocialId": "osde",
  "planId": "plan-210",
  "nroAfiliado": "123456"
}
```

| Campo          | Tipo             | Requerido | Descripcion                                |
|----------------|------------------|-----------|--------------------------------------------|
| `obraSocialId` | `string` (1-120) | Si        | ID de la obra social a marcar principal    |
| `planId`       | `string` (1-120) | No        | ID del plan                                |
| `nroAfiliado`  | `string` (1-120) | No        | Numero de afiliado                         |

### Respuesta exitosa `200`

```json
{ "ok": true }
```

---

## 4. Desmarcar afiliacion principal

### Endpoint BFF

```
PATCH /api/v1/portal/me/afiliaciones/principal/unset
```

### Headers requeridos

```
Authorization: Bearer <token>
```

Sin body.

### Respuesta exitosa `200`

```json
{ "ok": true }
```

---

## Errores comunes

| Status | Descripcion                                                                 |
|--------|-----------------------------------------------------------------------------|
| `400`  | Validacion fallida: campo requerido faltante, longitud invalida, etc.       |
| `401`  | Token ausente o expirado                                                    |
| `403`  | El token no tiene vinculo de cliente (`Usuario sin vínculo de cliente`)     |
| `404`  | Obra social o plan no encontrado en clientes-fsa                            |
| `422`  | La afiliacion no puede crearse por regla de negocio (duplicado, estado, etc)|
| `502`  | clientes-fsa no disponible o respondio con error 5xx                        |

---

## Notas importantes

- **No pasar el `clienteId` en la URL.** El BFF lo resuelve desde el token.
- El catalogo de obras sociales (`GET obras-sociales`) solo sirve para buscar opciones; no crea nada.
- Los campos `desde` / `hasta` van como strings ISO 8601 (`YYYY-MM-DD`) o `null`. No enviar objetos `Date`.
- Si se envia `principal: true` en el body del alta, no hace falta llamar al `PATCH /principal` por separado.