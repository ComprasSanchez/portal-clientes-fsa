
# Frontend Handoff: Auth, Perfil y Logistica

## Objetivo

Este documento resume el estado vigente del frontend despues del cambio de enfoque definido en `docs/bff-docs/frontend-integration.md`.

## Documentos a conservar para reconstruir contexto

Los MD que siguen siendo utiles para retomar este trabajo son:

- `docs/frontend-handoff-auth-profile-logistics.md`
- `docs/bff-docs/frontend-integration.md`
- `docs/portal-perfil-front-integration.md`
- `docs/google-social-login-flow.md`
- `docs/backend-keycloak-google-oauth.md`
- `docs/bff-docs/portal-expedientes.md`
- `docs/bff-docs/logistica.md`

La premisa actual es esta:

- en deploy, los proxies del front deben consumir el gateway publicado
- la autenticacion efectiva debe viajar por cookies de sesion
- no hay que reconstruir ni inyectar un bearer tecnico server-side para perfil, expedientes o logistica

## Estado actual

### Base upstream usada por los proxies protegidos

Los endpoints internos del front ahora usan:

- `NEXT_PUBLIC_FSA_SOCIOSA`

Esa base apunta al gateway publicado y ya incluye `/api/v1` en la URL.

Ejemplo de valor actual:

```env
NEXT_PUBLIC_FSA_SOCIOSA=https://api.dev.sanchezantoniolli.com.ar/api/v2/sociosa/api/v1/
```

`getRequiredBaseUrl()` sigue saneando:

- espacios
- comillas accidentales
- slash final

### Perfil

Se mantiene la integracion de:

- `/api/portal/me/perfil`

Pero ahora el proxy reenvia principalmente:

- `Cookie`
- `x-request-id`
- `Authorization` solo si ya viene en la request

Upstream final:

- `${NEXT_PUBLIC_FSA_SOCIOSA}/portal/me/perfil`

### Expedientes

Se mantiene la integracion de:

- `/api/portal/me/expedientes`
- `/api/portal/me/expediente-actual`

Upstream final:

- `${NEXT_PUBLIC_FSA_SOCIOSA}/portal/me/expedientes`
- `${NEXT_PUBLIC_FSA_SOCIOSA}/portal/me/expediente-actual`

La UI sigue derivando `cicloId` desde:

- `data.items[].cicloActual.cicloId`

Ademas, CORA ya consume el nuevo endpoint de expediente actual para evitar combinar manualmente listado + detalle en frontend.

### Logistica

Se mantiene la integracion de:

- `/api/logistica/:cicloId/parent-orders`

Upstream final:

- `${NEXT_PUBLIC_FSA_SOCIOSA}/logistica/:cicloId/parent-orders`

## Cambio de arquitectura aplicado

### Antes

Se habia avanzado con un esquema donde el frontend:

- intentaba obtener bearer por usuario
- guardaba tokens en cookies `httpOnly`
- y antes habia existido incluso un fallback con token tecnico compartido

### Ahora

Se alineo el frontend al comportamiento real del gateway:

- login y MFA solo deben conservar la sesion web (`sid`, `trusted_device_token` si corresponde)
- los proxies protegidos deben reutilizar esa sesion por cookies
- no se usa `FSA_AUTH_TOKEN_USERNAME`
- no se usa `FSA_AUTH_TOKEN_PASSWORD`
- no se usa `FSA_AUTH_TOKEN_URL`
- no se usa `NEXT_PUBLIC_FSA_BFF_CLIENTE_URL` para estos flujos

## Archivos clave modificados en este enfoque

- `src/app/api/_lib/proxy.ts`
- `src/app/api/portal/me/perfil/route.ts`
- `src/app/api/portal/me/expedientes/route.ts`
- `src/app/api/portal/me/expediente-actual/route.ts`
- `src/app/api/logistica/[cicloId]/parent-orders/route.ts`
- `src/app/api/auth/login/route.ts`
- `src/app/api/auth/mfa/verify/route.ts`
- `src/app/api/auth/logout/route.ts`

## Login y MFA

### Login

Archivo:

- `src/app/api/auth/login/route.ts`

Comportamiento actual:

- proxya `POST /login` al backend auth
- preserva `Set-Cookie` del upstream
- no hace exchange adicional de token

### MFA verify

Archivo:

- `src/app/api/auth/mfa/verify/route.ts`

Comportamiento actual:

- proxya `POST /mfa/verify`
- preserva cookies del upstream
- no requiere reenviar `username` ni `password`
- no hace exchange adicional de token

### Logout

Archivo:

- `src/app/api/auth/logout/route.ts`

Comportamiento actual:

- limpia `sid`
- limpia `trusted_device_token`
- tambien limpia cookies viejas de token si quedaron de iteraciones previas

## Caso de negocio especial: usuario sin vínculo de cliente

El backend puede devolver un `403` como este:

```json
{
  "statusCode": 403,
  "code": "FORBIDDEN",
  "message": "Usuario sin vínculo de cliente"
}
```

Ese caso ya no se muestra como error generico.

Se traduce a un mensaje amigable:

- `Tu usuario no tiene un cliente vinculado. Valida tu cuenta o comunicate con soporte para habilitar su cuenta.`

### Donde se resuelve

Archivo:

- `src/lib/use-portal-expedientes.ts`

Comportamiento:

- detecta `403`
- detecta el mensaje `Usuario sin vínculo de cliente`
- devuelve un texto amigable para UI

### Donde se muestra

#### CORA

Archivo:

- `src/components/organisms/home/HomeViews.tsx`

Comportamiento:

- muestra tarjeta de error en la vista de pedidos
- muestra estado mas claro en el resumen de ultimo pedido
- dispara toast global una sola vez

#### SocioSA

Archivo:

- `src/components/organisms/socios/SociosViews.tsx`

Comportamiento:

- consulta `usePortalExpedientes()` para detectar el mismo caso
- dispara el mismo toast global tambien en `/socios`

### Toast global

Archivos:

- `src/components/ui/global-toast.tsx`
- `src/app/layout.tsx`

Comportamiento:

- provider global montado en layout
- notificacion visual reutilizable
- se evita repetir el mismo toast continuamente usando un `id` fijo por caso

## Archivos clave para retomar el trabajo

### Auth y proxy

- `src/app/api/_lib/proxy.ts`
- `src/app/api/auth/login/route.ts`
- `src/app/api/auth/mfa/verify/route.ts`
- `src/app/api/auth/logout/route.ts`
- `src/app/api/auth/providers/google/callback/route.ts`

### Perfil UI

- `src/app/api/portal/me/perfil/route.ts`
- `src/lib/portal-profile.ts`
- `src/lib/portal-perfil-context.tsx`
- `src/lib/use-portal-perfil.ts`
- `src/components/organisms/profile/ProfileView.tsx`

### Expedientes y logistica

- `src/app/api/portal/me/expedientes/route.ts`
- `src/app/api/portal/me/expediente-actual/route.ts`
- `src/app/api/logistica/[cicloId]/parent-orders/route.ts`
- `src/lib/use-portal-expediente-actual.ts`
- `src/lib/use-portal-expedientes.ts`
- `src/types/portal-expediente-actual.ts`
- `src/lib/use-auth-logistica-tracking.ts`
- `src/lib/order-tracking.ts`
- `src/components/organisms/home/HomeViews.tsx`

### SocioSA y toast global

- `src/components/organisms/socios/SociosViews.tsx`
- `src/components/ui/global-toast.tsx`
- `src/app/layout.tsx`

## Pendientes reales

### 1. Verificar todos los entornos con el gateway publicado

Este cambio asume que deploy resuelve autenticacion por sesion via cookies.

Hay que validar en ambiente real:

- perfil
- expedientes
- expediente actual
- logistica por `cicloId`
- login tradicional
- MFA
- popup Google

### 2. Extraer logica compartida del toast de validacion

Hoy la deteccion y disparo del toast vive tanto en:

- `src/components/organisms/home/HomeViews.tsx`
- `src/components/organisms/socios/SociosViews.tsx`

Funciona, pero se puede refactorizar a un hook compartido para evitar duplicacion.

## Decisiones tomadas

### Preferir sesion web del gateway

La decision actual es:

- si el frontend corre dentro de la app autenticada, debe reutilizar `sid` y `trusted_device_token`
- solo conviene bearer manual cuando se prueba directo contra BFF local o fuera del navegador

### Evitar mezclar cookie valida con bearer manual viejo

Si el gateway ya autentica por sesion, no conviene inyectar un bearer manual desde el frontend porque puede introducir errores artificiales.

## Validaciones ya hechas

Durante los ultimos cambios quedaron validados estos puntos:

- login con credenciales preserva la sesion web del backend
- MFA preserva la sesion web del backend
- logout limpia cookies de sesion y cualquier resto de cookies de token viejo
- el `403 Usuario sin vínculo de cliente` se transforma en mensaje amigable
- el toast global aparece en CORA
- el toast global aparece en SocioSA
- los archivos modificados quedaron sin errores de TypeScript al cierre de cada cambio

## Recomendacion para retomar mas adelante

Si hay que seguir este trabajo en otra sesion, el orden recomendado es:

1. Leer `docs/frontend-handoff-auth-profile-logistics.md`.
2. Leer `docs/bff-docs/frontend-integration.md` para recordar el criterio de cookies vs bearer.
3. Revisar `src/app/api/_lib/proxy.ts` y los proxies de portal/logistica.
4. Revisar `src/app/api/auth/login/route.ts` y `src/app/api/auth/mfa/verify/route.ts`.
5. Revisar `src/lib/use-portal-expedientes.ts` y las vistas `HomeViews` y `SociosViews`.

## Nota final

El estado actual ya no depende de bearer tecnico ni de bearer por usuario para estos proxies del gateway. Si algo falla ahora, lo mas probable es que revele un problema real de sesion, cookies, permisos o vinculacion de cliente.
