# Flujo Google Social Login

## Objetivo

Dejar claro qué hace cada capa del sistema en el login social con Google usando popup:

- Frontend React/Next
- Next Route Handlers como proxy
- Backend BFF
- Keycloak
- Google

El objetivo final del flujo no es solo autenticar en Google/Keycloak, sino también crear la sesión local de la aplicación (`sid`).

---

## Resumen corto

Hay dos cierres distintos en el flujo:

1. Cierre federado
- Google y Keycloak validan la identidad del usuario.

2. Cierre de sesión local
- El backend procesa `code` y `state`, crea la sesión propia y responde `Set-Cookie: sid=...`.

Sin el segundo, no hay login usable en la app aunque Google haya autenticado bien.

---

## Flujo paso a paso

### 1. El usuario hace click en “Continuar con Google”

El frontend abre un popup hacia:

```txt
/api/auth/providers/google/start?mode=popup&redirectTo=/home
```

Archivo involucrado:
- `src/components/organisms/login/login.tsx`

Responsabilidad del frontend:
- Abrir popup
- Escuchar `postMessage`
- Verificar sesión después del cierre del popup
- Redirigir a `/home` si existe sesión local

---

### 2. Next proxy recibe `/start`

La ruta Next:

```txt
/api/auth/providers/google/start
```

reenvía la request al backend BFF:

```txt
{NEXT_PUBLIC_FSA_AUTH}/providers/google/start
```

Archivo involucrado:
- `src/app/api/auth/providers/google/start/route.ts`

Responsabilidad del proxy:
- Reenviar query params
- Reenviar headers `x-forwarded-host`, `x-forwarded-proto`, `x-forwarded-for`
- Propagar status, headers y `Set-Cookie`
- En local, opcionalmente reescribir `redirect_uri` con `FSA_AUTH_GOOGLE_REDIRECT_URI_OVERRIDE`

---

### 3. El backend inicia OAuth contra Keycloak

El backend construye una URL de autorización hacia Keycloak.

En este punto se generan o resuelven datos como:
- `state`
- PKCE (si corresponde)
- metadatos de popup
- contexto para cerrar el flujo después

Importante:
- Esto lo hace el backend, no el frontend.
- El frontend no debe generar `state`, `code`, `session_state` ni `iss`.

---

### 4. Keycloak delega en Google

Secuencia:

- Keycloak muestra/login broker
- Google autentica al usuario
- Google devuelve el resultado a Keycloak

Esto es autenticación federada.
Todavía no existe sesión local de la app.

---

### 5. Keycloak redirige al callback configurado

Keycloak redirige al `redirect_uri` configurado en el flujo.

Puede ser uno de estos dos esquemas:

#### Opción A: callback directo a backend

```txt
https://api.../v2/auth/providers/google/callback?state=...&code=...&session_state=...&iss=...
```

#### Opción B: callback al frontend proxy

```txt
https://sociosa.../api/v2/auth/providers/google/callback?state=...&code=...&session_state=...&iss=...
```

En ambos casos, el callback backend real debe terminar ejecutándose.

Archivos involucrados del lado Next:
- `src/app/api/auth/providers/google/callback/route.ts`
- `src/app/api/v2/auth/providers/google/callback/route.ts`
- `src/app/api/v2/auth/providers/google/[...segments]/route.ts`

---

### 6. El callback backend procesa `code` y `state`

Este es el punto crítico del flujo.

El backend debe:

- validar `state`
- validar `code`
- intercambiar el authorization code
- resolver usuario
- crear o recuperar sesión local
- emitir `sid`
- responder `Set-Cookie: sid=...`

Este paso es obligatorio.

Si el backend responde `200` pero no envía `Set-Cookie`, el usuario no queda autenticado en la app.

---

### 7. Si el flujo era popup, el callback devuelve HTML con `postMessage`

Después de crear la sesión local, el backend o el proxy debe devolver una respuesta popup compatible con:

- `window.opener.postMessage(...)`
- `window.close()`

El frontend principal recibe:
- `SOCIAL_AUTH_SUCCESS`
- o `SOCIAL_AUTH_ERROR`

Y después puede verificar sesión con un endpoint como:

```txt
/api/auth/session
```

Archivo involucrado:
- `src/app/api/auth/session/route.ts`

---

### 8. El frontend valida que exista sesión local

El frontend no debería asumir que Google autenticó = login completo.

Debe verificar si existe sesión real.

Actualmente esto se hace revisando si existe cookie `sid` mediante:

```txt
GET /api/auth/session
```

Si `authenticated: true`:
- redirigir a `/home`

Si `authenticated: false`:
- mostrar error
- permitir reintentar con `prompt=select_account consent`

---

## Parámetros del callback: de dónde salen

Estos parámetros no los genera el frontend:

### `state`
- Lo genera el backend/BFF al iniciar OAuth.
- Sirve para correlación y protección CSRF.

### `session_state`
- Lo agrega Keycloak.
- Representa la sesión del IdP.

### `iss`
- Es el issuer.
- Indica el realm/servidor que emitió la respuesta.

### `code`
- Es el authorization code de OAuth.
- Lo devuelve Keycloak para que el backend haga el intercambio.

El frontend proxy solo los reenvía tal cual.

---

## Qué hace cada capa

### Frontend
- abre popup
- escucha `postMessage`
- verifica sesión
- redirige a `/home`
- no genera `code`, `state`, `session_state`, `iss`

### Next proxy
- reenvía requests al backend
- preserva query params y headers
- preserva `Set-Cookie`
- puede exponer callbacks en `/api/auth/...` y `/api/v2/auth/...`

### Backend BFF
- inicia OAuth
- valida callback
- crea sesión local
- emite `sid`
- devuelve HTML popup success/error

### Keycloak
- broker federado
- delega login a Google
- devuelve `code`, `state`, `session_state`, `iss`

### Google
- autentica identidad externa

---

## Estado actual del proyecto

Con la implementación actual del frontend:

- el popup abre correctamente
- el `redirect_uri` local puede ser reescrito a localhost
- el callback llega al frontend proxy
- el callback responde `200`
- pero el backend está devolviendo:

```txt
[GOOGLE_CALLBACK] Upstream Set-Cookie: []
```

Eso significa:
- el flujo federado termina
- pero no se crea sesión local en navegador
- `/api/auth/session` devuelve `authenticated: false`

---

## Diagnóstico actual

El problema actual no es que falte llamar al callback.
El callback sí está siendo ejecutado.

El problema actual es que el callback exitoso no está emitiendo la cookie de sesión `sid`.

Sin eso:
- no hay sesión local
- no hay redirect útil a `/home`
- el popup puede cerrarse, pero la app sigue no autenticada

---

## Criterio de aceptación real del flujo

El login social recién debe considerarse correcto cuando se cumplen estas condiciones:

1. El popup abre el flujo OAuth.
2. Google/Keycloak autentican correctamente.
3. El callback backend se ejecuta.
4. El callback backend responde `Set-Cookie: sid=...`.
5. El navegador guarda `sid` para el dominio del frontend.
6. `GET /api/auth/session` devuelve `authenticated: true`.
7. El frontend redirige a `/home`.

Si falta el punto 4, el flujo todavía está incompleto.
