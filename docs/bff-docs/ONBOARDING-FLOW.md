# Onboarding Flow - Documentación para Frontend

Este documento describe el flujo de onboarding para registrar clientes con sus datos de identidad. El frontend debe implementar este flujo para capturar los datos del cliente y linkearlos con su cuenta.

## Endpoints

### 1. Iniciar Onboarding

```
POST /api/v2/auth/onboarding/start
```

**Headers:**
```
Content-Type: application/json
x-request-id: <opcional>
```

**Body:**
```json
{
  "account": {
    "username": "juanperez",
    "email": "juan@example.com",
    "password": "SecurePass123",
    "firstName": "Juan",
    "lastName": "Pérez"
  },
  "customerIdentity": {
    "tipoDocumento": "DNI",
    "nroDocumento": "12345678",
    "nombre": "Juan",
    "apellido": "Pérez",
    "sexo": "M",
    "fechaNacimiento": "1990-01-15",
    "telefono": "+5491112345678"
  },
  "accountKind": "CLIENTE"
}
```

**Campos:**

| Campo | Tipo | Requerido | Descripción |
|-------|------|----------|------------|
| `account.username` | string | ✅ | Username único |
| `account.email` | email | ✅ | Email válido |
| `account.password` | string | ✅ | Mín 6 caracteres |
| `account.firstName` | string | ❌ | Nombre |
| `account.lastName` | string | ❌ | Apellido |
| `customerIdentity.tipoDocumento` | string | ✅ | Tipo: DNI, CUIT, etc. |
| `customerIdentity.nroDocumento` | string | ✅ | Número de documento |
| `customerIdentity.nombre` | string | ✅ | Nombre |
| `customerIdentity.apellido` | string | ✅ | Apellido |
| `customerIdentity.sexo` | string | ❌ | M, F, otro |
| `customerIdentity.fechaNacimiento` | string | ❌ | YYYY-MM-DD |
| `customerIdentity.telefono` | string | ❌ | E.164: +549... |
| `accountKind` | string | ❌ | CLIENTE o COLABORADOR |

**Respuesta (HTTP 202):**

```json
{
  "ok": true,
  "flow": {
    "id": "uuid-del-flow",
    "status": "CHALLENGE_SENT",
    "expiresAt": 1710000000
  },
  "challenge": {
    "channel": "email",
    "destinationMasked": "ju***@example.com"
  },
  "nextStep": "VERIFY_TOKEN"
}
```

**Errores posibles:**

| Código | HTTP | Descripción |
|--------|------|-------------|
| AUTH_REGISTER_EMAIL_IN_USE | 409 | El email ya está registrado |
| AUTH_ONBOARDING_EMAIL_SEND_FAILED | 502 | No se pudo enviar el email |
| AUTH_VALIDATION_FAILED | 400 | Datos inválidos |

---

### 2. Verificar Email (Usuario hace clic en el link)

El frontend debe redirigir al usuario al link enviado por email:

```
GET /api/v2/auth/onboarding/verify-token?token=<token>
```

**URL del link:**
El link se envía por email y tiene este formato:
```
https://tuapp.com/api/v2/auth/onboarding/verify-token?token=abc123def456...
```

**Qué debe hacer el frontend:**

1. Interceptar esta URL (route: `/api/v2/auth/onboarding/verify-token`)
2. Si hay query param `token`, hacer redirect o fetch
3. Mostrar pantalla de verificación exitosa

**Respuesta (HTTP 200):**

```json
{
  "ok": true,
  "onboarding": {
    "status": "COMPLETED",
    "identityLinked": true,
    "deviceTrusted": true,
    "clienteId": "12345",
    "idempotent": false,
    "created": true
  }
}
```

**Campos de respuesta:**

| Campo | Descripción |
|-------|------------|
| `onboarding.status` | COMPLETED |
| `onboarding.identityLinked` | true (linkeado con cliente) |
| `onboarding.deviceTrusted` | true (dispositivo lembrado) |
| `onboarding.clienteId` | ID del cliente en el sistema |
| `onboarding.idempotent` | true si ya existía el cliente |
| `onboarding.created` | true si se creó nuevo |

---

### 3. Reenviar Email de Verificación

Si el usuario no recibió el email, puede reenviarlo:

```
POST /api/v2/auth/onboarding/resend
```

**Body:**
```json
{
  "flowId": "uuid-del-flow"
}
```

**Respuesta (HTTP 202):**
```json
{
  "ok": true,
  "flow": {
    "id": "uuid",
    "status": "CHALLENGE_SENT",
    "expiresAt": 1710000000
  },
  "challenge": {
    "channel": "email",
    "destinationMasked": "ju***@example.com"
  },
  "nextStep": "VERIFY_TOKEN"
}
```

---

## Cookies Establecidas

Cuando el usuario verifica su email exitosamente, el backend establece las siguientes cookies:

### Cookie: `trusted_device_token`

| Propiedad | Valor |
|-----------|-------|
| Nombre | `trusted_device_token` |
| Tipo | HttpOnly (no accesible via JS) |
| Duración | 30 días |
| SameSite | none (producción) / lax (desarrollo) |
| Secure | true (producción) |
| Path | / |

**Propósito:** Recordar el dispositivo para login sin MFA la próxima vez.

**Importante:** El frontend debe persistir esta cookie. Se envía automáticamente en requests futuros.

---

## Flujo Completo (Frontend)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    FRONTEND                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                          │
│  [Pantalla Registro]                                      │
│          │                                               │
│          ▼ POST /onboarding/start                         │
│          │ { account, customerIdentity, accountKind }    │
│          │                                              │
│  [Backend]────────────[Email Service]                    │
│       │                        │                       │
│       ▼                        ▼                       │
│  { flowId, CHALLENGE_SENT }  [Email con link]           │
│       │                        │                       │
│       │◄──────────────────────┘                       │
│       │                                              │
│       ▼                                              │
│  [Pantalla: "Revisá tu email"]                         │
│       │                                              │
│       │  (Usuario hace clic en el link)                   │
│       │                                              │
│       ▼ GET /onboarding/verify-token?token=xxx           │
│       │                                              │
│  [Backend]                                            │
│       │                                              │
│       ├→ Marca email verificado                        │
│       ├→ Upsert/linkea cliente en CRM               │
│       ├→ Genera trusted_device_token                 │
│       └→ set-cookie: trusted_device_token             │
│       │                                              │
│       ▼                                              │
│  { status: COMPLETED, clienteId }                   │
│       │                                              │
│       ▼                                              │
│  [Pantalla: "¡Bienvenido!"]                           │
│       │                                              │
│       ▼                                              │
│  Listo. Usuario logueado.                             │
│                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Implementación Recomendada

### Step 1: Formulario de Registro

```tsx
// RegisterForm.tsx
import { useState } from 'react';

export function RegisterForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [flowId, setFlowId] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/v2/auth/onboarding/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          account: {
            username: form.username,
            email: form.email,
            password: form.password,
            firstName: form.firstName,
            lastName: form.lastName,
          },
          customerIdentity: {
            tipoDocumento: form.tipoDocumento,
            nroDocumento: form.nroDocumento,
            nombre: form.nombre,
            apellido: form.apellido,
            sexo: form.sexo,
            fechaNacimiento: form.fechaNacimiento,
            telefono: form.telefono,
          },
          accountKind: 'CLIENTE',
        }),
      });

      const data = await res.json();

      if (!data.ok) {
        throw new Error(data.error?.message || 'Error en registro');
      }

      // Guardar flowId para reenviar si es necesario
      setFlowId(data.flow.id);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
}
```

### Step 2: Pantalla de Verificación Exitosa

```tsx
// VerificationSuccess.tsx
export function VerificationSuccess({ clienteId }: { clienteId: string }) {
  return (
    <div>
      <h1>¡Bienvenido!</h1>
      <p>Tu cuenta ha sido creada y verificada.</p>
      <p>Tu ID de cliente: {clienteId}</p>
      <button onClick={() => navigate('/dashboard')}>
        Ir a mi cuenta
      </button>
    </div>
  );
}
```

### Step 3: Manejo de la URL

```tsx
// App.tsx - rutas
import { Routes, Route, useSearchParams } from 'react-router';

export function App() {
  return (
    <Routes>
      {/* Página de verificación */}
      <Route
        path="/api/v2/auth/onboarding/verify-token"
        element={<VerificationHandler />}
      />
    </Routes>
  );
}

// VerificationHandler.tsx
export function VerificationHandler() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  useEffect(() => {
    if (token) {
      // Fetch para completar verificación
      fetch(`/api/v2/auth/onboarding/verify-token?token=${token}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.ok) {
            // Éxito: redirigir a pantalla de bienvenida
            navigate('/bienvenido', {
              state: { clienteId: data.onboarding.clienteId },
            });
          } else {
            // Error
            navigate('/error-verificacion');
          }
        });
    }
  }, [token]);

  return <Loading />;
}
```

---

## Errores y Cómo Manejarlos

### AUTH_REGISTER_EMAIL_IN_USE (409)

El email ya está registrado. Mostrar:
> "Ya tenés una cuenta con este email. ¿Querés recuperar tu contraseña?"

### AUTH_ONBOARDING_EXPIRED (400)

El link de verificación expiró. Mostrar:
> "El link expiró. ¿Querés que te enviemos otro?"

**Acción:** Llamar a `/onboarding/resend` con el `flowId`.

### AUTH_ONBOARDING_IDENTITY_LINK_CONFLICT (409)

Conflicto al linkear identidad. Requires resolución manual.

### AUTH_VALIDATION_FAILED (400)

Datos inválidos. Mostrar los errores específicos.

---

## Errores 403 FORBIDDEN y Cómo Evitarlos

Hay dos escenarios donde podés recibir un error 403:

### Escenario 1: Email No Verificado (AUTH_EMAIL_NOT_VERIFIED)

```
HTTP 403
{
  "ok": false,
  "error": {
    "code": "AUTH_EMAIL_NOT_VERIFIED",
    "message": "Email is not verified"
  }
}
```

**Por qué ocurre:** El usuario se registró pero no verificó su email.

**Cómo evitarlo:** Obligar al usuario a verificar el email ANTES de permitir cualquier acceso autenticado.

**Flujo:**
```
[Registro /onboarding/start]
    │
    ▼
[Verificar email /onboarding/verify-token]
    │
    ▼
[Ahora sí → hacer LOGIN]
```

---

### Escenario 2: Usuario Sin Vínculo de Cliente (FORBIDDEN downstream)

```
HTTP 403
{
  "ok": false,
  "error": {
    "code": " FORBIDDEN",  // o similar
    "message": "Usuario sin vinculo de cliente"
  }
}
```

**Por qué ocurre:**
- El usuario tiene sesión en Keycloak (está logueado)
- Pero NO completó onboarding ni identity-link
- Intenta acceder a un recurso que requiere `clienteId` (ej: /api/v1/clientes/*)

**Cómo evitarlo:** Hay dos estrategias:

#### Opción A: Forzar Identity-Link después del Login (RECOMENDADA)

```
[Usuario hace LOGIN]
    │
    ├─ si login exitoso:
    │     │
    │     ▼
    │ [consultar /identity-link/status]
    │     │
    │     ├─ si linked: ✓ continuar a dashboard
    │     │
    │     └─ si NO linked: → redirigir a completar identity-link
    │
    └─ si 403: → redirigir a completar identity-link
```

#### Opción B: Prevenir el Error - Obligar Onboarding Antes del Login

```
[Usuario intenta LOGIN]
    │
    ├─ si email NO verificado:
    │     └─ error 403 AUTH_EMAIL_NOT_VERIFIED
    │        → redirigir a verificar email
    │
    ├─ si login exitoso:
    │     │
    │     ▼
    │ [consultar /identity-link/status]
    │     │
    │     ├─ si linked: ✓ continuar
    │     │
    │     └─ si NO linked:
    │            → FORBIDDEN en next request
    │            →Redirigir a identity-link
```

---

## Flujo Recomendado (Evita 403)

### Paso 1: Verificar Estado Después del Login

```tsx
// afterLoginCheck.ts
async function checkUserStatus() {
  // 1. Consultar estado de identity-link
  const res = await fetch('/api/v2/auth/identity-link/status', {
    method: 'GET',
    credentials: 'include', // envía cookies
  });

  const data = await res.json();

  // 2. Si no está linkeado, redirigir
  if (!data.ok || !data.link?.linked) {
    navigate('/completar-perfil', {
      state: { reason: 'need_identity_link' }
    });
    return;
  }

  // 3. Está linkeado → continuar al dashboard
  navigate('/dashboard');
}
```

### Paso 2: Si Ocurre 403, Redirigir a Completar Perfil

```tsx
// authCallback.tsx - maneja cualquier 403 después del login
async function handleAuthError(error: AuthError) {
  if (error.code === 'AUTH_EMAIL_NOT_VERIFIED') {
    // Redirigir a verificar email
    navigate('/verificar-email');
    return;
  }

  if (error.status === 403) {
    // Redirigir a completar perfil (identity-link)
    navigate('/completar-perfil', {
      state: { reason: 'no_cliente_link' }
    });
    return;
  }

  // Otro error → mostrar mensaje
  showError(error.message);
}
```

---

## Endpoints de Identity-Link (Post-Login)

Después de que el usuario está logueado, puede completar su vínculo:

### 1. Consultar Estado

```
GET /api/v2/auth/identity-link/status
```

**Requiere:** Sesión (`sid` cookie)

**Respuesta:**
```json
{
  "ok": true,
  "link": {
    "linked": true,
    "status": "LINKED",
    "clienteId": "12345",
    "kcUserId": "uuid"
  }
}
```

### 2. Iniciar Link (si no está linkeado)

```
POST /api/v2/auth/identity-link/start
```

**Body:**
```json
{
  "tipoDocumento": "DNI",
  "nroDocumento": "12345678",
  "nombre": "Juan",
  "apellido": "Pérez",
  "sexo": "M",
  "fechaNacimiento": "1990-01-15",
  "phoneE164": "+5491112345678"
}
```

**Respuesta:**
```json
{
  "ok": true,
  "link": {
    "id": "uuid",
    "status": "INIT",
    "expiresAt": 1710000000
  }
}
```

### 3. Verificar OTP y Completar Link

```
POST /api/v2/auth/identity-link/verify
```

**Body:**
```json
{
  "linkId": "uuid-del-link",
  "code": "123456"
}
```

**Respuesta:**
```json
{
  "ok": true,
  "link": {
    "id": "uuid",
    "status": "LINKED",
    "clienteId": "12345",
    "kcUserId": "uuid",
    "created": true
  }
}
```

---

## UX Recomendada

### Flujo Completo que Evita Errores 403

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    FLUJO COMPLETO                                      │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  [Usuario no tiene cuenta]                                              │
│          │                                                              │
│          ▼                                                              │
│  [Registro: /onboarding/start]                                          │
│          │                                                              │
│          ▼  202                                                        │
│  [Pantalla: "Revisá tu email"]                                         │
│          │                                                              │
│          │  (Usuario hace clic en link)                                    │
│          ▼                                                              │
│  [Verificar: /onboarding/verify-token]                                   │
│          │                                                              │
│          ▼  200 + clienteId + set-cookie trusted_device_token            │
│  [Redirect a LOGIN]                                                    │
│          │                                                              │
│          ▼                                                              │
│  [LOGIN: /login]                                                       │
│          │                                                              │
│          ├─ success: { session }                                         │
│          │          │                                                   │
│          │          ▼                                                 │
│          │  [Verificar estado: GET /identity-link/status]               │
│          │          │                                                   │
│          │  ├─ linked: true → DASHBOARD                                 │
│          │  │                                                         │
│          │  └─ linked: false → REDIRIGIR A COMPLETAR PERFIL             │
│          │                 │                                             │
│          │                 ▼                                             │
│          │          [POST /identity-link/start]                           │
│          │                 │                                             │
│          │                 ▼  202                                        │
│          │          [POST /identity-link/challenge]                         │
│          │                 │                                             │
│          │                 ▼  202 → mostrar código OTP                   │
│          │                                                              │
│          │          [POST /identity-link/verify]                           │
│          │                 │                                             │
│          │                 ▼  200 → DASHBOARD                           │
│          │                                                              │
│          └─ failure: error 403 → manejar según código                      │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Pantalla 1: Formulario de Registro

- Mostrar todos los campos juntos (cuenta + identidad)
- Validación en tiempo real
- Loading mientras espera respuesta
- Si error, mostrar mensaje claro

### Pantalla 2: "Revisá tu Email"

- Mostrar email mascarado: `j u***@example.com`
- Botón "Reenviar email" (con cooldown de 60s)
- No hacer login automático (el usuario no está verificado aún)

### Pantalla 3: Verificación Exitosa

- Mostrar { `clienteId` } si está disponible
- Botón para ir al dashboard
- La cookie `trusted_device_token` ya está seteada

### Pantalla 4: Login Posterior

- Si existe `trusted_device_token`, el login no requiere MFA
- Si no existe, flujo normal de MFA

### Pantalla 5: Completar Perfil (Post-Login)

Esta pantalla se muestra cuando el usuario:
- Ya tiene sesión (logueado)
- Pero NO tiene vínculo con cliente (identity-link)

**Flujo:**
```
1. POST /identity-link/start → { linkId, status: INIT }
2. POST /identity-link/challenge → { challenge, channel: email }
3. Mostrar input para código OTP
4. POST /identity-link/verify → { linkId, status: LINKED, clienteId }
5. Redirigir a dashboard
```

**Código:**
```tsx
// CompleteProfile.tsx
export function CompleteProfile() {
  const [linkId, setLinkId] = useState<string | null>(null);
  const [step, setStep] = useState<'init' | 'verify'>('init');

  const handleStart = async () => {
    const res = await fetch('/api/v2/auth/identity-link/start', {
      method: 'POST',
      body: JSON.stringify({
        tipoDocumento: form.tipoDocumento,
        nroDocumento: form.nroDocumento,
        nombre: form.nombre,
        apellido: form.apellido,
        sexo: form.sexo,
        fechaNacimiento: form.fechaNacimiento,
        phoneE164: form.telefono,
      }),
    });

    const data = await res.json();
    setLinkId(data.link.id);
    setStep('verify');
  };

  const handleVerify = async (code: string) => {
    const res = await fetch('/api/v2/auth/identity-link/verify', {
      method: 'POST',
      body: JSON.stringify({ linkId, code }),
    });

    const data = await res.json();

    if (data.ok) {
      // Completado! Ir al dashboard
      navigate('/dashboard');
    }
  };
}
```

---

## Diferencia con `/register`

| Característica | `/register` | `/onboarding/start` |
|--------------|------------|------------------|
| Datos de identidad | ❌ | ✅ tipoDocumento, nroDocumento, sexo, etc. |
| Linkeo con cliente | ❌ | ✅ |
| Retorna clienteId | ❌ | ✅ |
| Flujo completo | Registro → verificar email | Registro + cliente + verificar |

---

## Notas Importantes

1. **Cookie `trusted_device_token`**: Se setea automáticamente. No necesitás hacer nada.
2. **Persistencia**: No es necesario guardar tokens en localStorage. La cookie es HttpOnly.
3. **Reenvío**: Si el usuario no tiene el email, guardar `flowId` para reenviar.
4. **Redirect**: Después de verificar, redirigir a `/bienvenido` o `/dashboard`.
5. **Idempotente**: Si el cliente ya existía, `created: false`. Mostrar "Bienvenido de nuevo".

---

## Código de Ejemplo Completo (simplificado)

```tsx
// hook useOnboarding
function useOnboarding() {
  const start = async (data: OnboardingData) => {
    const res = await fetch('/api/v2/auth/onboarding/start', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.json();
  };

  const resend = async (flowId: string) => {
    const res = await fetch('/api/v2/auth/onboarding/resend', {
      method: 'POST',
      body: JSON.stringify({ flowId }),
    });
    return res.json();
  };

  const verify = async (token: string) => {
    const res = await fetch(`/api/v2/auth/onboarding/verify-token?token=${token}`);
    return res.json();
  };

  return { start, resend, verify };
}
```

---

## Preguntas Frecuentes

**¿Necesito manejar tokens?** No. La cookie se maneja automáticamente.

**¿Qué pasa si el usuario cierra el browser?** Puede volver a completar el flujo si el `flowId` no expiró.

**¿Puedo reenviar el email?** Sí, con `/onboarding/resend` y el `flowId`.

**El usuario no verificó y el link expiró.** Llamar a `/onboarding/resend`.

**¿Qué es `clienteId`?** El ID del cliente en el sistema de clientes (CRM).

**¿Para qué sirve `trusted_device_token`?** Para que el próximo login no requiera MFA.

---

## Linksútiles

- Runbook Auth v2: `RUNBOOK_AUTH_V2.md`
- Errores:buscar en `src/context/Auth/core/errors`

---

**Última actualización:** Mayo 2026