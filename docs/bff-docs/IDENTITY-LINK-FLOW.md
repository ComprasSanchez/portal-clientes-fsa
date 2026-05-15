# Identity-Link Flow

Este documento describe el flujo completo para linkear un usuario de Keycloak con un cliente en el sistema `clientes-fsa`.

---

## Flujo Completo

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                        IDENTITY-LINK FLOW                                         │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│   ┌──────────┐        ┌──────────────┐        ┌────────────┐        ┌─────────┐          │
│   │  FRONTEND │ ────▶  │   START   │ ────▶  │ CHALLENGE │ ────▶ │ VERIFY  │          │
│   │          │        │  (POST)   │        │  (POST)  │        │ (POST)  │          │
│   └──────────┘        └──────────────┘        └────────────┘        └─────────┘          │
│                               │                  │                │         │               │
│                          linkId / linkId         linkId         code         LINKED                  │
│                          clienteId            channel         code         LINKED                  │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

## Prerrequisitos

- El usuario debe tener una sesión activa en Keycloak (cookie de sesión del BFF)
- El endpoint es `POST /v2/auth/identity-link/*`
- Todos los endpoints requieren autenticación (`SessionGuard`)

---

## Paso 1: POST /identity-link/start

Inicia el proceso de linking. Guarda el estado inicial del link en Redis.

### Request

```http
POST /v2/auth/identity-link/start
Content-Type: application/json
Cookie: session=<sid>

{
  "accountKind": "CLIENTE",                    // opcional: "CLIENTE" | "COLABORADOR"
  "externalSystem": "google",                 // opcional: sistema externo
  "externalRef": "user@google.com",          // opcional: referencia externa
  "tipoDocumento": "DNI",
  "nroDocumento": "12345678",
  "nombre": "Juan",
  "apellido": "Perez",
  "sexo": "M",                               // opcional: "M" | "F" | "X"
  "fechaNacimiento": "1990-01-15",            // opcional: ISO 8601
  "phoneE164": "+5491112345678",              // opcional: E.164 format
  "email": "juan@example.com",               // opcional
  "emailVerified": true                      // opcional
}
```

### Response (202 Accepted)

```json
{
  "ok": true,
  "link": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "status": "PENDING",
    "expiresAt": 1700000000,
    "clienteId": "CLI-000123"               // opcional: si se determinó cliente existente
  }
}
```

### Estados posibles del link después de START

| Status | Significado |
|-------|-------------|
| `PENDING` | Link creado, esperando challenge |
| `CLIENT_FOUND` | Ya existe un cliente con ese documento |
| `CLIENT_NEW_CANDIDATE` | No existe cliente, se creará uno nuevo |
| `LINKED` | El usuario ya está linkeado (idempotente) |

### Códigos de Error

| Código | HTTP | Descripción |
|--------|------|-------------|
| `AUTH_SESSION_INVALID` | 401 | No hay sesión activa |
| `AUTH_IDENTITY_LINK_CONFLICT` | 409 | Conflicto al buscar cliente por documento |
| `AUTH_IDENTITY_LINK_START_FAILED` | 500 | Error inesperado |

---

## Paso 2: POST /identity-link/challenge

Envía el código OTP al cliente vía el canal especificado.

### Request

```http
POST /v2/auth/identity-link/challenge
Content-Type: application/json
Cookie: session=<sid>

{
  "linkId": "550e8400-e29b-41d4-a716-446655440000",
  "channel": "email"
}
```

### Valores de Channel

| Channel | Descripción |
|---------|-----------|
| `email` | Envía OTP por email |
| `whatsapp` | Envía OTP por WhatsApp |

### Response (202 Accepted)

```json
{
  "ok": true,
  "challenge": {
    "linkId": "550e8400-e29b-41d4-a716-446655440000",
    "status": "CHALLENGE_SENT",
    "channel": "email",
    "expiresAt": 1700000000
  },
  "delivery": {
    "destinationMasked": "j***@example.com",
    "provider": "SENDGRID"
  },
  "debug": {
    "otpCode": "123456"                      // solo en desarrollo
  }
}
```

### Códigos de Error

| Código | HTTP | Descripción |
|--------|------|-------------|
| `AUTH_IDENTITY_LINK_INVALID` | 401 | Link no existe o expirado |
| `AUTH_IDENTITY_LINK_CHALLENGE_REQUIRED` | 400 | Challenge ya fue enviado |
| `AUTH_IDENTITY_LINK_CHANNEL_UNAVAILABLE` | 400 | Channel no disponible |
| `AUTH_IDENTITY_LINK_CHALLENGE_FAILED` | 500 | Error enviando OTP |

---

## Paso 3: POST /identity-link/verify

Verifica el código OTP y completa el linking entre Keycloak y el cliente.

### Request

```http
POST /v2/auth/identity-link/verify
Content-Type: application/json
Cookie: session=<sid>

{
  "linkId": "550e8400-e29b-41d4-a716-446655440000",
  "code": "123456"
}
```

### Response (200 OK)

```json
{
  "ok": true,
  "link": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "status": "LINKED",
    "clienteId": "CLI-000123",
    "kcUserId": "a1b2c3d4-e5f6-...",
    "idempotent": true,
    "created": false
  }
}
```

### Flujo Interno del Verify

```
1. Validar linkId + expiración
2. Validar código OTP (hash SHA-256)
3. Si código inválido → incrementar intentos
   - 5 intentos fallidos → lockout 10 min
4. Si userEmailVerified → grabar verificación de email
5. Si candidateClienteId → link directo
   Si no → upsert + link (crear cliente si no existe)
6. Actualizar atributos en Keycloak (clienteId, identityLinkedAt)
7. Actualizar estado en Redis a LINKED
```

### Códigos de Error

| Código | HTTP | Descripción |
|--------|------|-------------|
| `AUTH_IDENTITY_LINK_INVALID` | 401 | Link no existe o expiró |
| `AUTH_IDENTITY_LINK_EXPIRED` | 401 | Link expiró |
| `AUTH_IDENTITY_LINK_OTP_INVALID` | 401 | Código incorrecto |
| `AUTH_IDENTITY_LINK_OTP_LOCKED` | 429 | 5 intentos fallidos, bloqueado 10 min |
| `AUTH_IDENTITY_LINK_OTP_EXPIRED` | 401 | OTP expiró |
| `AUTH_IDENTITY_LINK_CONFLICT` | 409 | Conflicto al linking |
| `AUTH_IDENTITY_LINK_MIRROR_FAILED` | 502 | Linking ok pero falló actualización en Keycloak |
| `AUTH_IDENTITY_LINK_VERIFY_FAILED` | 500 | Error inesperado |

---

## Paso 4 (Opcional): GET /identity-link/status

Consulta el estado actual del link.

### Request

```http
GET /v2/auth/identity-link/status?linkId=550e8400-e29b-41d4-a716-446655440000
Cookie: session=<sid>
```

### Response (200 OK)

```json
{
  "ok": true,
  "link": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "status": "LINKED",
    "accountKind": "CLIENTE",
    "expiresAt": 1700000000,
    "clienteId": "CLI-000123"
  }
}
```

---

## Guía de Errores

### AUTH_IDENTITY_LINK_CONFLICT (409)

El error 409 significa que **el documento o email ya está vinculado a otra cuenta**.

#### Puede ocurrir en dos momentos:

| Momento | Endpoint | Causa |
|---------|----------|-------|
| START | `getClienteByDocumento` → 422 | No se puede determinar si crear o usar cliente existente |
| VERIFY | `upsertAndLinkEntity` → 422 | Documento/email ya linkedo a otro usuario |

#### Causas específicas:

| Causa | Descripción | Ejemplo |
|-------|-----------|--------|
| Documento ya linkeado | El documento está asociado a **otro usuario de Keycloak** | Juan se registra con DNI 123, luego Pedro intenta con el mismo DNI |
| Email ya usado | El email pertenece a **otro cliente** | "juan@gmail.com" está en el cliente de Juan, Pedro intenta usar el mismo email |
| Datos inconsistentes | El documento existe pero con datos diferentes | El documento existe pero con otro nombre |

#### Mapping para el frontend:

```typescript
function handleConflictError(error: IdentityLinkError) {
  if (error.code === 'AUTH_IDENTITY_LINK_CONFLICT') {
    
    // Según los detalles (si vienen)
    switch (error.details?.reason) {
      case 'DOCUMENTO_ALREADY_LINKED':
        return {
          title: 'Documento ya vinculado',
          message: 'Este número de documento ya está vinculado a otra cuenta en nuestro sistema.',
          suggestion: 'Si creías que este documento no estaba vinculado, por favor contactá a soporte.'
        };
      
      case 'EMAIL_ALREADY_USED':
        return {
          title: 'Email ya utilizado',
          message: 'Este correo electrónico ya está vinculado a otra cuenta.',
          suggestion: 'Por favor, utilizá otro correo electrónico o contactá a soporte.'
        };
      
      default:
        return {
          title: 'No se pudo completar el vínculo',
          message: 'Hubo un conflicto al vincular tu cuenta.',
          suggestion: 'Por favor, contactá a soporte para resolver este conflicto.'
        };
    }
  }
}
```

#### UI sugerida:

```
┌────────────────────────────────────┐
│         ⚠️  Atención              │
│                                    │
│  Este documento ya está vinculado  │
│  a otra cuenta en nuestro sistema.│
│                                    │
│  ¿Qué podemos hacer?               │
│                                    │
│  [Contactar a soporte]            │
│  [Intentar con otros datos]        │
└────────────────────────────────────┘
```

---

### AUTH_IDENTITY_LINK_OTP_LOCKED (429)

Después de 5 intentos fallidos, el link se bloquea por 10 minutos.

```json
{
  "code": "AUTH_IDENTITY_LINK_OTP_LOCKED",
  "message": "Identity-link verification temporarily locked",
  "status": 429,
  "details": {
    "retryAfterSec": 600
  }
}
```

#### UI sugerida:

```
┌────────────────────────────────────┐
│         🔒  Bloqueado               │
│                                    │
│  Demasiados intentos fallidos.      │
│  Intenta de nuevo en 10 minutos.    │
│                                    │
│   ⏱️ 09:45 para intentar          │
│                                    ��
│  [Reenviar código]                │
└────────────────────────────────────┘
```

---

### AUTH_IDENTITY_LINK_OTP_INVALID (401)

Código incorrecto, pero todavía hay intentos.

```json
{
  "code": "AUTH_IDENTITY_LINK_OTP_INVALID",
  "message": "Invalid identity-link OTP code",
  "status": 401,
  "details": {
    "remainingAttempts": 3
  }
}
```

#### UI sugerida:

```
┌────────────────────────────────────┐
│         ❌  Código incorrecto      │
│                                    │
│  El código no coincide.            │
│  Te quedan 3 intentos.             │
│                                    │
│  [ 1 ] [ 2 ] [ 3 ] [ 4 ] [ 5 ] [ 6]│
│                                    │
│  [Reenviar código]  [Continuar]     │
└────────────────────────────────────┘
```

---

## Estados del Link

| Estado | Descripción |
|-------|-----------|
| `INIT` | Inicializado |
| `PENDING` | Link creado, esperando challenge |
| `CHALLENGE_SENT` | OTP enviado, esperando verificación |
| `OTP_VERIFIED` | OTP válido, listo para hacer link |
| `CLIENT_FOUND` | Cliente existente encontrado |
| `CLIENT_NEW_CANDIDATE` | Nuevo cliente a crear |
| `LINKED` | Link completado exitosamente |
| `EXPIRED` | Link o OTP expiró |

---

## Ejemplo de Integración

### Flujo Completo en TypeScript

```typescript
const API_BASE = '/v2/auth';

interface LinkPayload {
  accountKind?: 'CLIENTE' | 'COLABORADOR';
  tipoDocumento: string;
  nroDocumento: string;
  nombre: string;
  apellido: string;
  sexo?: string;
  fechaNacimiento?: string;
  phoneE164?: string;
  email?: string;
  emailVerified?: boolean;
}

// Paso 1: Start
async function startLink(payload: LinkPayload) {
  const res = await fetch(`${API_BASE}/identity-link/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  
  if (!res.ok) {
    const error = await res.json();
    
    if (error.status === 409) {
      throw new Error('El documento o email ya está vinculado a otra cuenta');
    }
    
    throw new Error(error.message || 'Error al iniciar');
  }
  
  const data = await res.json();
  return data.link;
}

// Paso 2: Challenge
async function sendChallenge(linkId: string, channel: 'email' | 'whatsapp') {
  const res = await fetch(`${API_BASE}/identity-link/challenge`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ linkId, channel }),
  });
  
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Error al enviar código');
  }
  
  const data = await res.json();
  return data.challenge;
}

// Paso 3: Verify
async function verifyCode(linkId: string, code: string) {
  const res = await fetch(`${API_BASE}/identity-link/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ linkId, code }),
  });
  
  if (!res.ok) {
    const error = await res.json();
    
    if (error.status === 409) {
      // AUTH_IDENTITY_LINK_CONFLICT
      throw new Error('El documento/email ya está vinculado a otra cuenta');
    }
    
    if (error.status === 429) {
      // AUTH_IDENTITY_LINK_OTP_LOCKED
      throw new Error('Demasiados intentos. Intenta más tarde');
    }
    
    if (error.status === 401 && error.code === 'AUTH_IDENTITY_LINK_OTP_INVALID') {
      const remaining = error.details?.remainingAttempts ?? 0;
      throw new Error(`Código incorrecto. Te quedan ${remaining} intentos`);
    }
    
    throw new Error(error.message || 'Error al verificar');
  }
  
  const data = await res.json();
  return data.link;
}

// Flujo completo
async function fullLinkFlow(payload: LinkPayload, channel: 'email' | 'whatsapp') {
  // 1. Start
  const link = await startLink(payload);
  console.log('Link started:', link.id);
  
  // 2. Challenge
  const challenge = await sendChallenge(link.id, channel);
  console.log('Challenge sent to:', challenge.delivery.destinationMasked);
  
  // 3. Acá el usuario ingresa el código
  const code = await promptUserForCode();
  
  // 4. Verify
  const result = await verifyCode(link.id, code);
  console.log('Link completed:', result.clienteId);
  
  return result;
}
```

---

## Notas de Seguridad

1. **Expiry**: El link expira en 15 minutos
2. **OTP**: Código de 4-10 dígitos, expira en ~5 min
3. **Rate limiting**: 5 intentos máx, luego lockout 10 min
4. **Sesión requerida**: Todos los endpoints requieren cookie de sesión válida
5. **Idempotencia**: Si el cliente ya existe, no se crea otro

---

## Referencia Rápida

| Endpoint | Método | Auth | Descripción |
|----------|--------|-----|-----------|
| `/identity-link/start` | POST | ✅ | Iniciar linking |
| `/identity-link/challenge` | POST | ✅ | Enviar OTP |
| `/identity-link/verify` | POST | ✅ | Verificar OTP y linkear |
| `/identity-link/status` | GET | ✅ | Consultar estado |

---

## Checklist para el Frontend

- [ ] Mostrar error 409 de forma clara y amigable
- [ ] Ofrecer opción "Contactar soporte" 
- [ ] Ofrecer opción "Intentar con otros datos"
- [ ] Manejar error 429 con countdown
- [ ] Mostrar intentos restantes en error 401
- [ ] Para los errores 409, incluir el linkId en el reporte a soporte