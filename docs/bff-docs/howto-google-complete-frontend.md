# How-to — Completar onboarding Google en frontend (Auth v2)

Este documento explica **cómo debe decidir el frontend** cuándo llamar `POST /api/v2/auth/onboarding/google/complete` luego de login social.

---

## Problema

En este flujo hay dos estados distintos:

1. **Autenticado técnicamente** (hay sesión `sid`)
2. **Identidad de negocio vinculada** (`linked`)

`google/start` + `google/callback` resuelven (1).  
`onboarding/google/complete` resuelve (2).

Por eso, después del callback, el front debe consultar estado de link.

---

## Flujo recomendado (popup)

1. Front abre popup:
   - `GET /api/v2/auth/providers/google/start?mode=popup`
2. Callback técnico devuelve `postMessage`:
   - `SOCIAL_AUTH_SUCCESS` o `SOCIAL_AUTH_ERROR`
3. Si éxito, front consulta:
   - `GET /api/v2/auth/identity-link/status?accountKind=CLIENTE`
4. Branching:
   - `linked: true` → navegar a Home
   - `linked: false` (`status: NOT_LINKED`) → mostrar formulario onboarding
5. Enviar formulario:
   - `POST /api/v2/auth/onboarding/google/complete`
6. Si `ok: true` → usuario operativo

---

## Contratos relevantes

### 1) Mensaje popup

Éxito:

```json
{ "type": "SOCIAL_AUTH_SUCCESS" }
```

Error:

```json
{ "type": "SOCIAL_AUTH_ERROR", "error": "AUTH_SOME_CODE" }
```

### 2) Estado de link (`GET /identity-link/status`)

Respuesta típica vinculada:

```json
{
  "ok": true,
  "link": {
    "linked": true,
    "status": "LINKED",
    "clienteId": "...",
    "kcUserId": "..."
  }
}
```

Respuesta típica pendiente:

```json
{
  "ok": true,
  "link": {
    "linked": false,
    "status": "NOT_LINKED",
    "clienteId": null,
    "kcUserId": null
  }
}
```

---

## Ejemplo frontend (React/Next)

```ts
type SocialAuthMessage =
  | { type: 'SOCIAL_AUTH_SUCCESS' }
  | { type: 'SOCIAL_AUTH_ERROR'; error: string };

async function getIdentityLinkStatus() {
  const res = await fetch(
    '/api/v2/auth/identity-link/status?accountKind=CLIENTE',
    { credentials: 'include' },
  );

  if (res.status === 401) {
    throw new Error('SESSION_MISSING');
  }

  if (!res.ok) {
    throw new Error('IDENTITY_STATUS_FAILED');
  }

  const data = await res.json();
  return data.link as { linked: boolean; status: string };
}

async function handleGoogleSuccess() {
  const link = await getIdentityLinkStatus();

  if (link.linked) {
    window.location.assign('/home');
    return;
  }

  // Pendiente de onboarding de negocio
  window.location.assign('/onboarding/google');
}

function onPopupMessage(event: MessageEvent) {
  // validar origin del backend
  if (event.origin !== 'https://api.tu-dominio.com') return;

  const data = event.data as SocialAuthMessage;
  if (!data || typeof data !== 'object' || !('type' in data)) return;

  if (data.type === 'SOCIAL_AUTH_SUCCESS') {
    handleGoogleSuccess().catch(() => {
      window.location.assign('/auth/error?code=IDENTITY_STATUS_FAILED');
    });
    return;
  }

  if (data.type === 'SOCIAL_AUTH_ERROR') {
    window.location.assign(`/auth/error?code=${encodeURIComponent(data.error)}`);
  }
}
```

---

## Endpoint de complete (formulario)

Request:

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

Response:

```json
{
  "ok": true,
  "onboarding": {
    "status": "COMPLETED",
    "identityLinked": true,
    "deviceTrusted": true,
    "clienteId": "cliente-1",
    "idempotent": false,
    "created": true
  }
}
```

---

## Checklist de integración

- [ ] Popup usa `mode=popup`
- [ ] Listener valida `event.origin`
- [ ] Front usa `credentials: 'include'`
- [ ] Se consulta `identity-link/status` tras `SOCIAL_AUTH_SUCCESS`
- [ ] Si `NOT_LINKED`, se navega a formulario onboarding
- [ ] Formulario llama `onboarding/google/complete`
- [ ] Manejo de errores (`401`, timeout popup, popup blocked)
