# Investigación: Email de login distinto al email del perfil

## El problema observado

El usuario Farid Rodriguez inicia sesión con `rodriguezfarid25@gmail.com` pero en la vista de perfil
aparece `saliti3154@ameady.com` como email principal. Al intentar cambiar ese email desde el perfil,
el sistema responde:

```json
{
    "statusCode": 400,
    "code": "BAD_REQUEST",
    "message": "No se permite reemplazar email verificado con identity-link activo; usar flujo dedicado de cambio de email",
    "timestamp": "2026-06-10T11:44:54.946Z",
    "path": "/api/v1/portal/me/contactos",
    "requestId": "96df2a19-1b78-4dcb-b35e-82a6556ee9de"
}
```

---

## Por qué existen dos emails distintos

El sistema tiene dos fuentes de verdad separadas para el email:

| Sistema | Email de Farid | Función |
| --- | --- | --- |
| **Keycloak** | `rodriguezfarid25@gmail.com` | Login / autenticación |
| **clientes-fsa (CRM)** | `saliti3154@ameady.com` | Perfil / datos de negocio |

Cuando Farid hizo el onboarding con `rodriguezfarid25@gmail.com` y su DNI `43561947`,
el BFF llamó a `upsert-and-link` en clientes-fsa. Ese DNI ya existía en el CRM con un
registro previo que tenía `saliti3154@ameady.com`. El sistema:

1. Encontró el cliente existente por DNI
2. Vinculó el KC account a ese registro (`kcUserId ↔ clienteId`)
3. **No actualizó el email del CRM** — porque ya estaba verificado y hay una regla de negocio
   que lo protege

El perfil muestra datos de **clientes-fsa**, no de Keycloak. Por eso el usuario ve el email viejo.

---

## La regla de negocio que bloquea el cambio

clientes-fsa rechaza el reemplazo directo del email cuando se cumplen las dos condiciones:

- El email del registro ya está **verificado**
- El registro tiene un **identity-link activo** (está vinculado a una cuenta KC)

El mensaje de error sugiere que existe (o debería existir) un "flujo dedicado de cambio de email"
que probablemente incluya verificación del nuevo email antes de reemplazar el anterior.

---

## Preguntas abiertas

1. **¿El `upsert-and-link` debería actualizar el email del CRM al registrarse?**
   Si el cliente ya existe con email verificado, ¿lo pisa o lo respeta? Esto determina si
   la divergencia es un bug o un comportamiento intencional.

2. **¿Existe el flujo dedicado de cambio de email?**
   El error lo menciona explícitamente. Puede estar ya implementado en el BFF o puede ser
   solo una validación defensiva sin implementación del flujo aún.

3. **¿Es un caso esperado tener KC y CRM con emails distintos?**
   Podría ser legítimo: cliente preexistente en el CRM que se registra en el portal con
   un email diferente al que tenía en el sistema.

---

## Dónde vamos a buscar

### BFF — `C:\Users\Usuario\Documents\front-fsa\BFF\bff-gateway\src`

Es el lugar más probable. El flujo dedicado de cambio de email viviría aquí como un use case
y un endpoint expuesto en algún controlador. Buscar:

- Cualquier archivo con `email-change`, `change-email`, `cambio-email` o similar en el nombre
- Use cases bajo `src/context/Auth/application/use-cases/` o `src/context/Portal/`
- Endpoints en los controladores bajo `src/context/Auth/infrastructure/controllers/`
  o `src/context/Portal/infrastructure/controllers/`
- El mensaje exacto del error para trazar desde dónde se lanza:
  `"No se permite reemplazar email verificado con identity-link activo"`

### clientes-fsa (si tenemos acceso al repo)

El error viene de downstream (clientes-fsa), no del BFF. La validación está ahí.
Buscar el mensaje del error para entender la regla de negocio completa y si hay
un endpoint alternativo documentado.

### Frontend — `c:\Users\Usuario\Documents\front-fsa\portal-clientes-fsa\src`

Ver si hay alguna ruta o componente que implemente el flujo de cambio de email
más allá del endpoint genérico de contactos:

- `src/app/api/` — rutas proxy que podrían apuntar a un flujo de email change
- `src/components/` — algún modal o formulario específico para cambio de email verificado

---

## Resultados de la búsqueda

### El error viene de clientes-fsa, no del BFF

El mensaje no lo genera el BFF — lo genera **clientes-fsa** directamente, en dos use cases:

| Archivo | Cuándo se lanza |
| --- | --- |
| `clientes-fsa/src/application/clientes/use-cases/commands/AddContactoToCliente.ts` (línea 42) | Al intentar **agregar** un email nuevo |
| `clientes-fsa/src/application/clientes/use-cases/commands/UpdateContactoOfCliente.ts` (línea 46) | Al intentar **editar** un email existente |

La condición que dispara el error es:

```typescript
if (linked && existing.props.verificado && currentEmail !== nextEmail) {
  throw new BadRequestException(
    'No se permite cambiar email verificado con identity-link activo; usar flujo dedicado de cambio de email',
  );
}
```

Es decir: si el email ya está verificado + hay un identity-link activo + el nuevo email es distinto → rechaza.

### El flujo dedicado NO existe

Se buscó en los tres repos (BFF, frontend, clientes-fsa) y no hay ninguna implementación de un
flujo de cambio de email verificado. El mensaje del error lo referencia pero nadie lo implementó.
Es una validación defensiva que bloquea el camino sin ofrecer alternativa real todavía.

**BFF** — use cases existentes en `src/context/Auth/application/use-cases/`:
`change-pass`, `create-session`, `get-me`, `v2-identity-link-*`, `v2-onboarding-*`,
`v2-login`, `v2-mfa-*`, `v2-register`, `v2-resend-verify-email`, `v2-reset-password`,
`v2-verify-email` → **ninguno de email change**

**Frontend** — no hay ninguna ruta bajo `src/app/api/` para un flujo de cambio de email verificado.

**clientes-fsa** — no hay endpoint alternativo para este caso.

---

## Estado actual

| Componente | Estado |
| --- | --- |
| Validación en clientes-fsa | ✅ Existe y bloquea correctamente |
| Flujo dedicado de cambio de email en BFF | ❌ No implementado |
| Endpoint en clientes-fsa para email change | ❌ No implementado |
| UI en el frontend para este flujo | ❌ No implementado |

---

## Plan de acción

El flujo completo hay que construirlo desde cero en los tres repos. Lo mínimo sería:

1. **clientes-fsa**: endpoint dedicado que permita cambiar el email verificado con
   verificación del nuevo email (OTP o link)
2. **BFF**: use case + endpoint que orqueste el flujo (similar a identity-link:
   start → challenge → verify)
3. **Frontend**: UI para solicitar y confirmar el cambio de email desde el perfil
