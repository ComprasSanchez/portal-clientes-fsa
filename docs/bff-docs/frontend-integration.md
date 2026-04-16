# Frontend Integration Guide

> Documento de referencia operativa del BFF/gateway. Para contexto general del frontend, leer primero `docs/frontend-handoff-auth-profile-logistics.md`.

## Objetivo

Este documento resume lo que frontend necesita saber para consumir los endpoints del BFF sin tener que reconstruir la lógica desde código o desde varios MD distintos.

Incluye:

- cómo autenticarse según el entorno
- cuándo usar bearer y cuándo usar cookies de sesión
- qué endpoints principales están disponibles
- ejemplos rápidos para frontend y Postman
- recomendaciones prácticas para no romper sesiones válidas

## Resumen corto

Hay dos escenarios distintos.

### 1. Local directo al BFF

Si frontend o Postman le pegan directo al Nest local, por ejemplo:

- `http://localhost:4423/api/v1/...`

los endpoints protegidos esperan:

- `Authorization: Bearer <jwt>`

### 2. Deploy detrás del gateway

Si frontend consume la URL publicada, por ejemplo:

- `https://api.dev.sanchezantoniolli.com.ar/api/v2/sociosa/api/v1/...`

la autenticación efectiva puede resolverse por sesión web usando cookies:

- `sid`
- `trusted_device_token`

En ese escenario no hace falta mandar `Authorization` manualmente si la sesión ya está vigente.

## Regla práctica para frontend

- app web logueada contra gateway: preferir sesión por cookies
- pruebas locales directas al BFF: usar bearer
- si el gateway ya tiene una sesión válida, evitar mandar un bearer viejo o vencido

## Por qué pasa esto

El Nest de este repo valida JWT cuando la request le pega directo.

Pero cuando la request entra por el gateway publicado, esa capa superior puede resolver la identidad del usuario usando la sesión (`sid` + `trusted_device_token`) antes de llegar al BFF.

Por eso en deploy puede funcionar una request con cookies aunque el bearer manual ya esté vencido.

## Qué no hacer

- no mezclar cookies válidas con un bearer viejo si el gateway ya te autentica por sesión
- no asumir que el Nest local entiende `sid` por sí solo
- no asumir que Postman y navegador se comportan igual si uno tiene sesión activa y el otro no

## Headers por escenario

### Local directo al BFF

```http
Authorization: Bearer <token>
x-request-id: front-001
Accept: application/json
```

### Deploy detrás del gateway

```http
Cookie: sid=<sid>; trusted_device_token=<trusted_device_token>
x-request-id: front-001
Accept: application/json
```

## Endpoints principales para frontend

### Portal

- `GET /api/v1/portal/me`
- `GET /api/v1/portal/me/perfil`
- `GET /api/v1/portal/me/dashboard`
- `GET /api/v1/portal/me/expedientes`
- `GET /api/v1/portal/me/expediente-actual`
- `GET /api/v1/portal/me/compras`
- `GET /api/v1/portal/me/puntos`

### Logística

- `GET /api/v1/logistica/:cicloId/parent-orders`
- `GET /api/v1/logistica/parent-orders/sucursal`
- `GET /api/v1/logistica/parent-orders/:code`
- `GET /api/v1/logistica/:cicloId/parent-orders/summary`
- `POST /api/v1/logistica/parent-orders/summary`

## Ejemplos rápidos

### Perfil vía gateway con cookies

```bash
curl.exe --location "https://api.dev.sanchezantoniolli.com.ar/api/v2/sociosa/api/v1/portal/me/perfil" ^
  --header "Cookie: sid=TU_SID; trusted_device_token=TU_TRUSTED_DEVICE_TOKEN" ^
  --header "x-request-id: front-perfil-001"
```

### Expedientes vía gateway con cookies

```bash
curl.exe --location "https://api.dev.sanchezantoniolli.com.ar/api/v2/sociosa/api/v1/portal/me/expedientes?accountKind=CLIENTE&limit=20&offset=0" ^
  --header "Cookie: sid=TU_SID; trusted_device_token=TU_TRUSTED_DEVICE_TOKEN" ^
  --header "x-request-id: front-expedientes-001"
```

### Expediente actual vía gateway con cookies

```bash
curl.exe --location "https://api.dev.sanchezantoniolli.com.ar/api/v2/sociosa/api/v1/portal/me/expediente-actual" ^
  --header "Cookie: sid=TU_SID; trusted_device_token=TU_TRUSTED_DEVICE_TOKEN" ^
  --header "x-request-id: front-expediente-actual-001"
```

### Parent orders por ciclo vía gateway con cookies

```bash
curl.exe --location "https://api.dev.sanchezantoniolli.com.ar/api/v2/sociosa/api/v1/logistica/TU_CICLO_ID/parent-orders" ^
  --header "Cookie: sid=TU_SID; trusted_device_token=TU_TRUSTED_DEVICE_TOKEN" ^
  --header "x-request-id: front-logistica-001"
```

## Recomendación de implementación en frontend

Si el frontend corre dentro de la app web autenticada:

- consumir el gateway publicado
- reutilizar la sesión web activa del navegador
- evitar reconstruir manualmente el bearer salvo que realmente se necesite

Si el frontend necesita una capa API interna:

- centralizar base URL
- centralizar `x-request-id`
- diferenciar claramente entorno local vs deploy
- dejar el manejo de errores HTTP uniforme

## Casos donde sí conviene usar bearer

- desarrollo local contra `localhost:4423`
- pruebas técnicas donde no existe sesión web activa
- scripts de integración fuera del navegador

## Documentación complementaria

- `docs/portal-expedientes.md`
- `docs/portal-expediente-actual.md`
- `docs/logistica.md`
- `docs/postman-session-examples.md`
- `docs/guide.md`
