
# Frontend Handoff: Auth, Perfil y Logistica

## Objetivo

Este documento resume el estado vigente del frontend despues del cambio de enfoque definido en `BFF/bff-cliente-web/docs/frontend-integration.md` (repo aparte, ya no se mantiene copia local).

## Documentos a conservar para reconstruir contexto

Los MD que siguen siendo utiles para retomar este trabajo son:

- `docs/frontend-handoff-auth-profile-logistics.md`
- `BFF/bff-cliente-web/docs/frontend-integration.md` (repo aparte, ya no se mantiene copia local)
- `docs/portal-perfil-front-integration.md`
- `docs/google-social-login-flow.md`
- `docs/backend-keycloak-google-oauth.md`
- `BFF/bff-cliente-web/docs/portal-expedientes.md` (repo aparte)
- `BFF/bff-cliente-web/docs/logistica.md` (repo aparte)
- `docs/cora-expedientes-handoff.md` (diseño/decisiones del alta-edición de expedientes desde CORA)

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

### Verificación de email (onboarding) y OTP repetido (2026-08)

**Problema reportado:** después de registrarse y verificar el email, el login
siguiente volvía a pedir OTP/MFA, en vez de saltearlo por `trusted_device_token`.

**Causa raíz:** el link de verificación de email apuntaba directo a un endpoint
que mutaba estado en un `GET` de un solo uso. Cualquier scanner de seguridad de
email (Gmail Safe Browsing, Outlook Safe Links, antivirus corporativos) que
visitara el link antes del click real del usuario consumía el token y evitaba
que la cookie `trusted_device_token` llegara al navegador real.

**Fix aplicado:**

- `BFF/bff-gateway/src/context/Auth/auth.config.ts` — default de
  `onboardingVerifyUrl` cambiado de apuntar directo a la API a apuntar a la home
  del portal (`http://localhost:3000/`).
- `src/app/api/v2/auth/onboarding/verify-token/route.ts` — el `GET` ya no llama
  al upstream ni muta nada; solo redirige a `/?token=...`. La verificación real
  la hace `login.tsx` por `POST`, disparado desde el navegador real del usuario
  (mismo que hará el login siguiente).

**Validado en local** (bff-gateway + portal-clientes-fsa + notificaciones-fsa
corriendo localmente): un `GET` simulando un bot al link viejo nunca llega a
`bff-gateway` (0 requests en su log); verificar y loguear con el mismo
`User-Agent` da `mfa.required:false, reason:trusted_device` (sin OTP).

**Hallazgo colateral (informativo, no se tocó nada por esto):** el proxy del
portal no reenvía el `User-Agent` real hacia `bff-gateway` — confirmado
comparando llamadas directas a `bff-gateway` (ahí un UA distinto entre verificar
y loguear sí fuerza MFA, como se espera) contra llamadas vía el proxy del
portal (donde no fuerza nada). Conclusión: el chequeo de UA de `isTrusted()` no
aporta protección adicional específicamente a través del portal — lo que en la
práctica sigue exigiendo "mismo dispositivo" es que la cookie `trusted_device_token`
(HttpOnly) solo existe en el navegador que la recibió. Si en el futuro se quiere
que el chequeo de UA tenga efecto real vía portal, haría falta empezar a
reenviar el `User-Agent` original en el proxy — no hay nada pendiente de hacer
hoy, solo queda documentado.

**Pendiente (ver sección "Pendientes reales" más abajo):** limpiar usuarios de
prueba creados en Keycloak/`clientes-fsa` durante esta validación.

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

### 3. Borrar usuarios de prueba del fix de verificación/OTP (2026-08)

Al validar el fix de la sección "Verificación de email (onboarding) y OTP
repetido" se crearon 5 usuarios de prueba contra un ambiente **compartido**
(`KC_ISSUER_URL` de `bff-gateway/.env` no es localhost — es un realm Keycloak
remoto/compartido):

| Username | Email | Documento (DNI) | Llegó a verificar (`identityLinked`) |
| --- | --- | --- | --- |
| `otptestuser1` | `otptest1@example.com` | 99887766 | No (falló el envío de mail, notificaciones-fsa no estaba levantado en ese momento) |
| `otptestuser2` | `otptest2@example.com` | 99887767 | Sí |
| `otptestuser3` | `otptest3@example.com` | 99887768 | Sí |
| `otptestuser4` | `otptest4@example.com` | 99887769 | Sí |
| `otptestuser5` | `otptest5@example.com` | 99887770 | Sí |

Los que llegaron a `identityLinked: true` (2 a 5) también tienen un registro
creado en `clientes-fsa` (`cliente` + `cliente_identity_link`, mismos documentos).

**Por qué no se borró ya:** ni `bff-gateway` ni `clientes-fsa` tienen hoy una
forma de borrar un usuario/cliente:

- `bff-gateway`: `KeycloakIdentityAdminAdapter`
  (`src/context/Auth/infrastructure/adapters/keycloak-id-admin.adapter.ts`) no
  tiene método `deleteUser` (sí tiene `createUser`, `findUserByEmail`,
  `setPassword`, etc., y ya resuelve el token de admin internamente — agregar
  el borrado sería una función chica).
- `clientes-fsa`: no hay `DELETE` de cliente completo ni de
  `cliente_identity_link` (solo de sub-recursos como contactos/domicilios).
- Ninguno de los dos repos tiene consola/REPL/script de cleanup ya armado.

**Plan cuando se retome:**

1. Agregar `deleteUser(userId)` al puerto/adapter de Keycloak en `bff-gateway`
   (reusa `getAdminToken()` ya existente — el client secret nunca sale del proceso).
2. Script standalone (`NestFactory.createApplicationContext`, no un endpoint
   HTTP) que resuelve `userId` de cada email vía `findUserByEmail` (ya existe),
   borra en Keycloak, y corre una sola vez imprimiendo solo un resumen ok/error
   por usuario (sin secretos).
3. Decidir si conviene también borrar los registros de `clientes-fsa`
   (documentos 99887767-99887770) o dejarlos — son datos aislados con DNI
   falso, sin impacto real si quedan.
4. Después de correrlo: decidir si se revierte el `deleteUser` agregado (por
   defecto, revertir — no conviene dejar un borrado de usuarios "de yapa" en una
   app de auth productiva sin que alguien lo pida a propósito) o se deja como
   capacidad permanente.

Nota: `bff-gateway` (puerto 3002) y `notificaciones-fsa` (puerto 3008) quedaron
corriendo localmente a pedido para poder seguir probando.

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
2. Leer `BFF/bff-cliente-web/docs/frontend-integration.md` (repo aparte, ya no se mantiene copia local) para recordar el criterio de cookies vs bearer.
3. Revisar `src/app/api/_lib/proxy.ts` y los proxies de portal/logistica.
4. Revisar `src/app/api/auth/login/route.ts` y `src/app/api/auth/mfa/verify/route.ts`.
5. Revisar `src/lib/use-portal-expedientes.ts` y las vistas `HomeViews` y `SociosViews`.

## Nota final

El estado actual ya no depende de bearer tecnico ni de bearer por usuario para estos proxies del gateway. Si algo falla ahora, lo mas probable es que revele un problema real de sesion, cookies, permisos o vinculacion de cliente.
