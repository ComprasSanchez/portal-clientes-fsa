# APP-64 — Onboarding unificado (email token + google complete)

## Objetivo

Unificar el journey de alta para evitar que frontend orqueste pasos técnicos dispersos.

- **Flujo local:** registro + verificación email + link identidad + bootstrap de trusted device.
- **Flujo social (Google):** mantener start/callback para autenticación, y agregar `google/complete` para completar identidad + trust.

> Nota: `google/complete` **no reemplaza** `google/start`; lo complementa.

---

## Decisiones funcionales cerradas

1. Verificación única de onboarding local por **token (link)**, vía `POST` y soporte `GET` para click directo de email.
2. Opción A (sin autologin): al completar onboarding, el siguiente login debe entrar sin MFA en el mismo dispositivo.
3. Reusar arquitectura existente (ports/adapters/use-cases) y evitar duplicación.
4. Trusted device solo se emite al completar link de identidad exitosamente.

---

## Contratos API

## 1) `POST /api/v2/auth/onboarding/start`

Inicia o reanuda onboarding local.

### Request

```json
{
  "account": {
    "username": "juan.perez",
    "email": "juan@mail.com",
    "password": "secret123",
    "firstName": "Juan",
    "lastName": "Pérez"
  },
  "customerIdentity": {
    "tipoDocumento": "DNI",
    "nroDocumento": "30111222",
    "nombre": "JUAN",
    "apellido": "PEREZ",
    "sexo": "M",
    "fechaNacimiento": "1988-02-01",
    "telefono": "+5491112345678"
  },
  "accountKind": "CLIENTE",
  "externalSystem": "APP",
  "externalRef": "u-123"
}
```

### Response

```json
{
  "ok": true,
  "flow": {
    "id": "f7cf2a26-2f2c-4f74-9f66-6ac0f65c73a4",
    "status": "CHALLENGE_SENT",
    "expiresAt": 1730000000
  },
  "challenge": {
    "channel": "email",
    "destinationMasked": "ju***@mail.com"
  },
  "nextStep": "VERIFY_TOKEN"
}
```

## 2) `POST /api/v2/auth/onboarding/verify-token`

Valida token del mail y completa onboarding local.

### Request

```json
{
  "token": "raw_verification_token"
}
```

## 2.1) `GET /api/v2/auth/onboarding/verify-token?token=...`

Alias para click directo desde email. Ejecuta exactamente la misma lógica que el `POST`.

## 2.2) `POST /api/v2/auth/onboarding/resend`

Reenvía el challenge email para un flujo de onboarding existente.

### Request

```json
{
  "flowId": "f7cf2a26-2f2c-4f74-9f66-6ac0f65c73a4"
}
```

### Response

```json
{
  "ok": true,
  "flow": {
    "id": "f7cf2a26-2f2c-4f74-9f66-6ac0f65c73a4",
    "status": "CHALLENGE_SENT",
    "expiresAt": 1730000000
  },
  "challenge": {
    "channel": "email",
    "destinationMasked": "ju***@mail.com"
  },
  "nextStep": "VERIFY_TOKEN"
}
```

### Response

```json
{
  "ok": true,
  "flow": {
    "id": "f7cf2a26-2f2c-4f74-9f66-6ac0f65c73a4",
    "status": "COMPLETED",
    "emailVerified": true,
    "identityLinked": true,
    "deviceTrusted": true
  },
  "nextStep": "LOGIN"
}
```

## 3) `POST /api/v2/auth/onboarding/google/complete`

Completa onboarding para sesión ya autenticada por Google.

### Guard

- `SessionGuard` (requiere `sid` válido)

### Request

```json
{
  "customerIdentity": {
    "tipoDocumento": "DNI",
    "nroDocumento": "30111222",
    "nombre": "JUAN",
    "apellido": "PEREZ",
    "sexo": "M",
    "fechaNacimiento": "1988-02-01",
    "telefono": "+5491112345678"
  },
  "accountKind": "CLIENTE",
  "externalSystem": "APP",
  "externalRef": "u-123"
}
```

### Response

```json
{
  "ok": true,
  "onboarding": {
    "status": "COMPLETED",
    "identityLinked": true,
    "deviceTrusted": true
  }
}
```

---

## Flujo frontend

## Local (email/password)

1. `POST /auth/onboarding/start`
2. Usuario abre link de mail (frontend captura `token`)
3. Front llama `POST /auth/onboarding/verify-token` (o usa link directo `GET`)
4. Redirige a login
5. Login entra sin MFA (mismo dispositivo) por trusted token ya emitido

## Google

1. `GET /auth/providers/google/start`
2. `GET /auth/providers/google/callback` (session cookie `sid`)
3. Front detecta onboarding pendiente
4. Muestra formulario de datos cliente
5. `POST /auth/onboarding/google/complete`
6. Usuario queda operativo

---

## Reuso explícito de arquitectura existente

- `IdentityAdminPort` (create/find/markEmailVerified/setUserAttributes)
- `ClientesIdentityLinkPort` (status/getCliente/link/upsertAndLink)
- `TrustedDevicePort` (`remember` / `isTrusted`)
- `EmailVerificationNotifierPort` (mail con link)
- `SessionStoreRedis` para estado efímero
- `V2TrackTrustedDeviceEventUseCase` para auditoría

No se reemplaza flujo social de autenticación (`google/start` + `google/callback`).

---

## Lista de tareas (implementación)

1. Definir tipos/puertos de estado onboarding.
2. Implementar adapter Redis para estado onboarding.
3. Implementar `V2OnboardingStartUseCase`.
4. Implementar `V2OnboardingVerifyTokenUseCase`.
5. Implementar `V2OnboardingGoogleCompleteUseCase`.
6. Crear DTOs onboarding.
7. Exponer endpoints en `v2-auth.controller.ts`.
8. Registrar wiring en `auth.module.ts`.
9. Agregar config TTL onboarding trusted device.
10. Alinear cookie trusted device con TTL de onboarding cuando aplique.
11. Pruebas unitarias mínimas de use-cases nuevos.

---

## Archivos a tocar

### Nuevos

- `src/context/Auth/core/types/onboarding.types.ts`
- `src/context/Auth/core/ports/onboarding-state.port.ts`
- `src/context/Auth/infrastructure/adapters/redis-onboarding-state.adapter.ts`
- `src/context/Auth/application/use-cases/v2-onboarding-start.usecase.ts`
- `src/context/Auth/application/use-cases/v2-onboarding-verify-token.usecase.ts`
- `src/context/Auth/application/use-cases/v2-onboarding-resend.usecase.ts`
- `src/context/Auth/application/use-cases/v2-onboarding-google-complete.usecase.ts`
- `src/context/Auth/infrastructure/dto/v2-onboarding.dto.ts`

### Existentes

- `src/context/Auth/core/tokens.ts`
- `src/context/Auth/auth.config.ts`
- `src/context/Auth/auth.module.ts`
- `src/context/Auth/infrastructure/controllers/v2-auth.controller.ts`

---

## Errores de negocio propuestos

- `AUTH_ONBOARDING_INVALID`
- `AUTH_ONBOARDING_EXPIRED`
- `AUTH_ONBOARDING_TOKEN_INVALID`
- `AUTH_ONBOARDING_TOKEN_EXPIRED`
- `AUTH_ONBOARDING_ALREADY_COMPLETED`
- `AUTH_ONBOARDING_IDENTITY_LINK_CONFLICT`
- `AUTH_ONBOARDING_COMPLETE_FAILED`
