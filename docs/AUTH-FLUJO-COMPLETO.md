# Flujo completo de Registro y Login

## Arquitectura general

```
Browser / Next.js (portal-clientes-fsa)
        │  fetch a /api/...
        ▼
Next.js API Routes (proxy interno)
        │  fetch a BFF
        ▼
BFF (bff-gateway) — NestJS, puerto 3002
        │  HTTP downstream
        ├──► Keycloak  (identity provider — tokens, sesiones, OAuth)
        └──► clientes-fsa (servicio de negocio — vincula KC user ↔ cliente CRM)
```

El frontend **nunca habla directamente con Keycloak ni con clientes-fsa**. Todo pasa por el BFF. Las Next.js API routes actúan de proxy local (agregan cookies, traducen errores, etc.).

---

## Conceptos clave

| Concepto | Descripción |
|---|---|
| **kcUserId** | ID del usuario en Keycloak. Identifica la cuenta de autenticación. |
| **clienteId** | ID del cliente en clientes-fsa. Identifica a la persona en el CRM/sistema de negocio. |
| **Identity Link** | Vínculo entre un `kcUserId` y un `clienteId`. Sin este vínculo, el usuario está autenticado pero no puede acceder a sus datos de cliente. |
| **Onboarding** | Flujo de **registro nuevo**: crea cuenta KC + vincula identidad en un solo flujo con verificación de email. |
| **Identity Link Flow** | Flujo de **vinculación post-login**: usuario ya existente que aún no tiene su DNI/datos vinculados. |
| **Trusted Device** | Token de dispositivo de confianza (TTL ~7 días). Si está presente, se omite el MFA. |
| **accountKind** | `CLIENTE` (usuario final) o `COLABORADOR` (empleado interno, requiere email @sanchezantoniolli.com.ar). |

---

## 1. Flujo de Registro (Onboarding)

### Descripción general
El registro es un flujo en dos pasos: (1) crear la cuenta y (2) verificar el email. Solo al verificar el email se vincula la identidad en clientes-fsa.

### Paso a paso

```
1. Usuario llena el formulario: email, password, nombre, apellido,
   tipo/nro documento, sexo, fecha nacimiento, teléfono

2. POST /api/v2/auth/onboarding/start
   Frontend → Next.js route → BFF

   BFF hace:
   a) Busca si ya existe usuario KC con ese email
      - Si existe y NO tiene email verificado: reutiliza la cuenta
      - Si existe con email verificado: puede fallar o reusar dependiendo del caso
   b) Si no existe: crea usuario en KC (email + password + nombre)
   c) Crea estado del flujo de onboarding en Redis/estado:
      { flowId, userId, email, payload (DNI, nombre...), tokenHash, expiresAt }
   d) Envía email con link de verificación que contiene el token
   e) Responde: { ok: true, flow: { id, status: 'CHALLENGE_SENT' }, challenge: { destinationMasked } }
   f) En desarrollo: también devuelve { verificationLink } en la respuesta

3. Frontend muestra pantalla "verify-onboarding": 
   "Te enviamos un link a t***@gmail.com"
   - El usuario puede reenviar con POST /api/v2/auth/onboarding/resend

4. Usuario hace clic en el link del email
   → GET /api/v2/auth/onboarding/verify-token?token=XXX
   → O bien POST con el token en el cuerpo

   BFF hace:
   a) Busca el flow por hash del token en Redis
   b) Valida que no esté expirado
   c) Marca el email como verificado en KC
   d) Llama a clientes-fsa: POST /clientes/identity-link/upsert-and-link
      clientes-fsa:
        - Busca cliente por DNI (si existe lo actualiza, si no lo crea)
        - Crea el IdentityLink: { kcUserId ↔ clienteId }
   e) Guarda clienteId en atributos del usuario KC
   f) Crea trusted device token
   g) Responde: { status: 'COMPLETED', trustedDeviceToken, clienteId, ... }
```

### Error: conflicto de DNI
Si el DNI ya está vinculado a **otro** kcUserId:
- clientes-fsa lanza `IdentityLinkConflictDeferredError` → HTTP 422
- BFF convierte a `AUTH_ONBOARDING_IDENTITY_LINK_CONFLICT` → HTTP 409
- Frontend muestra mensaje con el email enmascarado (ej: `d***@gmail.com`) de la cuenta ya vinculada

---

## 2. Flujo de Login (Email + Password)

### Paso a paso

```
1. Usuario ingresa username (email) y password

2. POST /api/auth/login
   
   BFF hace:
   a) Autenticación contra KC con Resource Owner Password Grant
   b) Verifica que el email esté verificado en KC
      → Si no: error AUTH_EMAIL_NOT_VERIFIED
   c) Verifica si hay trusted device token (cookie trustedDeviceToken)
      → Si hay y es válido: omite MFA, crea sesión directamente (reason: 'trusted_device')
   d) Si no hay trusted device: crea MFA login ticket (TTL 5 min)
      Responde: { ok: true, flow: { status }, mfa: { required: true, loginTicket, channels: ['email'] } }

3. Si se requiere MFA:
   
   POST /api/auth/mfa/challenge
   BFF envía OTP por email (6 dígitos, TTL configurable)
   Responde: { ok: true, challenge: { channel: 'email', destinationMasked } }

   Usuario ingresa el código de 6 dígitos

   POST /api/auth/mfa/verify
   BFF valida el OTP
   Si válido: crea sesión KC, setea cookie de sesión (sid), crea trusted device
   Responde: { ok: true, flow: { status: 'COMPLETED', identityLinked, deviceTrusted } }

4. Si identityLinked === false:
   Frontend muestra el flujo de Identity Link (ver sección 3)

5. Si identityLinked === true:
   Frontend redirige a /socios
```

### Respuestas del login con su significado

| `nextStep` / estado | Qué hace el frontend |
|---|---|
| `mfa.required: true` | Muestra pantalla MFA |
| `flow.identityLinked: false` | Muestra pantalla de vinculación de identidad |
| `flow.identityLinked: true` | Redirige a `/socios` |
| Error `AUTH_EMAIL_NOT_VERIFIED` | Muestra opción de reenviar verificación |

---

## 3. Flujo de Vinculación de Identidad (Identity Link)

Este flujo ocurre cuando el usuario ya está autenticado (tiene sesión KC) pero aún no tiene su DNI/datos vinculados al CRM.

### Cuándo se activa
- Después de login exitoso si `identityLinked === false`
- Manualmente vía query param `?identityLink=pending`

### Paso a paso

```
1. Usuario completa el formulario:
   nombre, apellido, tipo/nro documento, sexo, fecha nacimiento, teléfono, email

2. POST /api/v2/auth/identity-link/start
   BFF crea el estado del flujo de vinculación

3. POST /api/v2/auth/identity-link/challenge  (automático tras el start)
   BFF envía OTP por email (6 dígitos)

4. Usuario ingresa el código

5. POST /api/v2/auth/identity-link/verify
   BFF valida el OTP, luego:
   a) Llama a clientes-fsa: POST /clientes/identity-link/upsert-and-link
   b) Guarda clienteId en KC
   c) Responde { ok: true, flow: { identityLinked: true } }

6. Frontend redirige a /socios

GET /api/v2/auth/identity-link/status
   Consulta si el usuario ya tiene identidad vinculada (útil para polling)
```

### Error: conflicto de DNI en identity-link
Igual que en onboarding:
- BFF lanza `AUTH_IDENTITY_LINK_CONFLICT` (no `AUTH_ONBOARDING_...`)
- Frontend muestra mensaje con email enmascarado

---

## 4. Flujo de Google OAuth

### Registro nuevo con Google

```
1. Usuario hace clic en "Continuar con Google"
   GET /api/v2/auth/providers/google/start
   BFF genera estado PKCE, redirige a Google

2. Google autentica y redirige a:
   GET /api/v2/auth/providers/google/callback?code=...&state=...
   BFF intercambia code por tokens KC
   - Si es usuario nuevo: crea usuario KC con los datos de Google
   - Responde: set cookie de sesión + redirect con query params

3. Frontend detecta query param ?onboarding=google o ?googleAuth=...
   Muestra pantalla "google-onboarding":
   - Formulario para completar datos de identidad (DNI, nombre, apellido, etc.)
   - Email pre-rellenado con el de Google

4. POST /api/v2/auth/onboarding/google/complete
   BFF hace:
   a) Marca email como verificado en KC (Google ya lo verificó)
   b) Registra verificación de email con provider=GOOGLE
   c) Verifica si ya existe identity link (idempotencia)
   d) Si no existe: llama a clientes-fsa upsert-and-link
   e) Guarda clienteId en KC
   f) Crea trusted device
   g) Responde { status: 'COMPLETED', clienteId, ... }
```

### Login con Google (usuario existente)

```
1-2. Igual que arriba (start → callback)
3. Callback detecta que el usuario ya tiene identity link
   Redirige a /socios directamente (sin pantalla de onboarding)
```

---

## 5. Flujo de Recuperación de Contraseña

```
1. Usuario ingresa su email/username
   POST /api/auth/forgot-password
   BFF envía OTP de reset (TTL configurable)
   Responde: { challenge: { id, expiresAt } }

2. Usuario ingresa el código y la nueva contraseña
   POST /api/auth/reset-password
   { code, newPassword, challengeId }
   BFF valida el OTP y actualiza la contraseña en KC
```

---

## 6. Qué pasa en clientes-fsa (upsert-and-link)

El endpoint `POST /clientes/identity-link/upsert-and-link` hace lo siguiente:

```
1. PRE-CHECK (antes de modificar nada):
   - Busca cliente por DNI en la DB
   - Si existe: verifica si hay un IdentityLink activo con otro kcUserId
   - Si hay conflicto → lanza IdentityLinkConflictDeferredError(maskedEmail)
     (el maskedEmail viene del cliente ANTES de que se sobreescriba el contacto)

2. UpsertVerificacion:
   - Si existe cliente con ese DNI: actualiza sus datos (email, teléfono, nombre, etc.)
   - Si no existe: crea el cliente nuevo
   - Retorna el clienteId

3. LinkIdentity (en transacción):
   - Verifica que no haya otro link activo para ese kcUserId o clienteId (conflicto)
   - Crea el registro IdentityLink { kcUserId, clienteId, accountKind }
   - Opcionalmente sincroniza con Wibi (loyalty) si es el primer link

4. RecordEmailVerification:
   - Guarda registro de cómo se verificó el email (EMAIL_LINK, PROVIDER/GOOGLE, etc.)
```

### Manejo de errores en clientes-fsa → BFF

| Error en clientes-fsa | HTTP | Código en BFF frontend |
|---|---|---|
| `IdentityLinkConflictDeferredError` | 422 → 409 | `AUTH_IDENTITY_LINK_CONFLICT` o `AUTH_ONBOARDING_IDENTITY_LINK_CONFLICT` |
| `IdentityLinkExternalRefRequiredError` | 422 | — |
| `IdentityLinkCorporateEmailInvalidError` | 422 | — |

---

## 7. Códigos de error del BFF (manejo en frontend)

Definidos en `src/helpers/error-message.ts` y `src/lib/authErrors.ts`:

| Código | Cuándo ocurre | Mensaje mostrado |
|---|---|---|
| `AUTH_MFA_INVALID_CODE` | OTP de MFA incorrecto | Muestra intentos restantes |
| `AUTH_MFA_CODE_INVALID` | Variante del anterior | Muestra intentos restantes |
| `AUTH_IDENTITY_LINK_OTP_INVALID` | OTP de identity link incorrecto | Muestra intentos restantes |
| `AUTH_IDENTITY_LINK_OTP_LOCKED` | Demasiados intentos en identity link | Muestra segundos de espera |
| `AUTH_IDENTITY_LINK_CONFLICT` | DNI ya vinculado (flujo identity-link) | Muestra email enmascarado |
| `AUTH_ONBOARDING_IDENTITY_LINK_CONFLICT` | DNI ya vinculado (flujo onboarding) | Muestra email enmascarado |
| `AUTH_EMAIL_VERIFY_RESEND_COOLDOWN` | Reenvío demasiado frecuente | Muestra segundos de espera |
| `AUTH_RESET_INVALID_CODE` | Código de reset incorrecto | Muestra intentos restantes |
| `AUTH_RESET_LOCKED` | Demasiados intentos de reset | Muestra segundos de espera |
| `AUTH_ONBOARDING_TOKEN_INVALID` | Token de onboarding inválido/expirado | Error genérico |
| `AUTH_ONBOARDING_TOKEN_EXPIRED` | Token de onboarding expirado | Error genérico |

---

## 8. Estado de pantallas del frontend (AuthCardView)

El componente Login en `src/components/organisms/login/login.tsx` maneja estas vistas:

| Vista | Cuándo se muestra |
|---|---|
| `login` | Pantalla inicial |
| `register` | Click en "Registrarse" |
| `mfa` | Login exitoso + MFA requerido |
| `verify-onboarding` | Después de registro (esperando verificación de email) |
| `identity-link` | Post-login si `identityLinked: false`, o `?identityLink=pending` |
| `identity-link-verify` | Después de completar formulario de identity link (ingresa OTP) |
| `forgot-password` | Click en "Olvidé mi contraseña" |
| `reset-password` | Después de solicitar reset (ingresa OTP + nueva password) |
| `google-onboarding` | Callback de Google en usuario nuevo (`?onboarding=google`) |

---

## 9. Query params relevantes en la URL de home

| Param | Efecto |
|---|---|
| `?identityLink=pending` | Fuerza vista `identity-link` |
| `?onboarding=google` | Fuerza vista `google-onboarding` |
| `?token=XXX` o `?onboardingToken=XXX` | Auto-verifica el token de onboarding |
| `?verificationToken=XXX` | Auto-verifica el token de verificación de email |
| `?redirectTo=URL` | Redirige a esa URL tras login exitoso |
| `?googleAuthError=...` | Muestra error del flujo Google |

---

## 10. Notas de desarrollo local

- **OTP en desarrollo**: con `NODE_ENV=development` en el BFF, el OTP se devuelve directamente en la respuesta JSON (campo `debugCode` o similar). No hace falta Sendgrid.
- **Links de verificación**: los endpoints `/onboarding/start`, `/register` y `/resend` devuelven `verificationLink` en la respuesta cuando `NODE_ENV=development`.
- **Stub de notificaciones**: si `AUTH_NOTIFICACIONES_BASE_URL` está vacío, se usa el stub que acepta el envío sin hacer nada (no falla, no envía).
