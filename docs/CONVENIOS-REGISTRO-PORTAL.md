# Registro de Convenios en el Portal

## Contexto y motivación

Antes, cuando un usuario llegaba por un link de convenio (por ejemplo desde un QR o un email de empresa), se lo enviaba a un sitio externo:

```
https://verificacion.sanchezantoniolli.com.ar/?canal=convenio&sucursal=cocacola
```

Ese sitio era independiente del portal: registraba al usuario directamente en el CRM (`crm-webservice`) con `canal=CONVENIO` y `convenio=COCACOLA`, guardando el dato en `clientes_new.convenio`. No creaba cuenta de portal (Keycloak).

**El objetivo ahora es traer ese flujo adentro del portal**, en una URL propia:

```
https://portal.sanchezantoniolli.com.ar/convenio/cocacola
```

---

## Arquitectura real del sistema — dos bases de datos separadas

Esta es la parte más importante para entender por qué el flujo de convenios va directo al CRM.

### Los dos sistemas de clientes

| Sistema | Proyecto | Base de datos | Tabla | Sincroniza con |
|---|---|---|---|---|
| **clientes-fsa** | `clientes-fsa` | PostgreSQL | `clientes.clientes` | WIBI (loyalty) |
| **CRM** | `crm-webservice` | MySQL | `clientes_new` | Plex (sistema legacy) |

**Son completamente independientes — no se sincronizan entre sí.**

### ¿Qué pasa cuando alguien se registra por el portal?

```
Portal → BFF (bff-gateway) → Keycloak (cuenta auth)
                            → clientes-fsa (POST /clientes/identity-link/upsert-and-link)
                                  └→ WIBI (sync loyalty)
```

El cliente queda en `clientes.clientes` (PostgreSQL de clientes-fsa). El campo `convenio` **no existe** en ese esquema. Los campos que acepta `upsert-and-link` son: nombre, apellido, documento, sexo, fechaNacimiento, email, teléfono, domicilio, afiliación (obra social). Nada de convenio.

### ¿Qué pasa cuando alguien se registra por el CRM?

```
CRM webservice → clientes_new (MySQL)
                      └→ Plex (sync legacy)
```

El cliente queda en `clientes_new`. Ahí sí existe `clientes_new.convenio`, `clientes_new.canal`, etc.

### Por qué no usamos el flujo de auth del portal para guardar el convenio

Tres razones:

1. **No existe el campo.** El BFF, clientes-fsa y el endpoint `upsert-and-link` no aceptan ni pasan `convenio`. No hay donde guardarlo en ese sistema.
2. **Sería la base equivocada.** El convenio es un dato del CRM (`clientes_new`), no de clientes-fsa. Agregar `convenio` a clientes-fsa requeriría cambios en BFF + clientes-fsa + la lógica de negocio asociada, en un sistema que no es el dueño de ese dato.
3. **No es necesario.** El CRM ya tiene todo el flujo de convenio implementado y funcionando.

---

## Por qué usamos el CRM directamente

El portal ya proxea llamadas al CRM a través de `/api/legacy/`. El CRM tiene endpoints específicos para este caso:

- `GET /cliente/:dni` — busca si el cliente ya existe
- `POST /clientes/start` — inicia el alta o actualización, envía OTP por teléfono
- `POST /clientes/confirm` — confirma el OTP y aplica el registro

Estos endpoints manejan solos si el cliente es nuevo (`ALTA`) o ya existe (`ACTUALIZACION`). En ambos casos se puede pasar `convenio=COCACOLA` y `canal=CONVENIO`, y el dato queda guardado en `clientes_new.convenio`.

No hay problema de "URL param que se pierde en redirects" porque este flujo es completamente autocontenido en una sola página — no hay redirects de auth.

---

## Arquitectura de la solución

```
/convenio/[slug]   (slug = nombre del convenio, ej: "cocacola")
        │
        ├── src/app/convenio/[slug]/page.tsx
        │       Server Component — lee el slug, renderiza el cliente
        │
        └── src/components/organisms/convenio/ConvenioRegistroView.tsx
                Client Component — maneja los pasos del formulario
```

**Proxies nuevos** (mismo patrón que `/api/legacy/sorteos/participar`):

| Ruta portal | Proxea a CRM | Uso |
|---|---|---|
| `GET /api/legacy/cliente/[dni]` | `GET /cliente/:dni` | Detectar si el usuario ya existe |
| `POST /api/legacy/clientes/start` | `POST /clientes/start` | Iniciar alta/actualización + enviar OTP |
| `POST /api/legacy/clientes/confirm` | `POST /clientes/confirm` | Confirmar OTP y guardar convenio |

---

## Flujo paso a paso

### Paso 1 — DNI

El usuario ingresa su DNI. El portal consulta `GET /api/legacy/cliente/:dni`.

- Si `found: true` → el cliente ya existe en el CRM. Se muestra su nombre y solo se pide el teléfono para verificar.
- Si `found: false` → cliente nuevo. Se muestra el formulario completo.

### Paso 2 — Datos

**Cliente existente:**
```
"Hola JUAN PEREZ, verificá tu teléfono para asociarte al convenio COCACOLA"
└── Campo: teléfono
└── Checkbox: acepta términos
```

**Cliente nuevo:**
```
"Completá tus datos para asociarte al convenio COCACOLA"
└── Campos: nombre, apellido, teléfono, email (opcional)
└── Checkbox: acepta términos
```

En ambos casos se llama a `POST /api/legacy/clientes/start` con:

```json
{
  "Documento": "30123456",
  "Nombre": "JUAN",
  "Apellido": "PEREZ",
  "Telefono": "5493871234567",
  "convenio": "COCACOLA",
  "canal": "CONVENIO",
  "aceptaTerminos": true
}
```

El CRM detecta solo si es ALTA o ACTUALIZACION según si el cliente existe. Devuelve `pending_id`.

### Paso 3 — OTP

El CRM envía un código de 6 dígitos por WhatsApp/SMS al teléfono ingresado. El usuario lo ingresa en el portal.

Se llama a `POST /api/legacy/clientes/confirm`:

```json
{
  "pending_id": 123,
  "codigo": "456789"
}
```

Si el código es correcto, el CRM aplica el pendiente y guarda `clientes_new.convenio = "COCACOLA"`.

### Paso 4 — Éxito

Se muestra una pantalla de confirmación. El usuario puede continuar al portal si ya tiene cuenta.

---

## Campos del CRM

| Campo | Qué representa | Ejemplo |
|---|---|---|
| `convenio` | Empresa o institución | `COCACOLA`, `YPF` |
| `canal` | Origen del alta | `CONVENIO` (fijo para este flujo) |
| `sucursal_codigo` | Sucursal real (opcional) | Solo si hay una sucursal física real |

> El campo `sucursal` del link viejo (`?sucursal=cocacola`) en realidad representaba el nombre del convenio, no una sucursal real. En la nueva URL eso queda claro: el slug `/convenio/cocacola` es el convenio.

---

## Comportamiento del CRM ante el convenio

- Si el convenio existe en la tabla `Convenios` → se reutiliza
- Si no existe → se crea automáticamente con `estado = PENDIENTE`, `origen = MANUAL`
- El flujo nunca se bloquea por no encontrar el convenio

---

## Puente entre los dos sistemas: sorteos/participar

El endpoint `/sorteos/participar` es el que conecta clientes-fsa con clientes_new. Cuando un usuario del portal (que existe en clientes-fsa) participa en un sorteo:

```
Portal → POST /api/legacy/sorteos/participar
              { documento, canal, convenio? }
                    ↓
         CRM (crm-webservice)
              └→ Si el cliente NO existe en clientes_new:
                    crea el registro con canal = "SOCIOSA_PORTAL"
                 Si el cliente ya existe:
                    usa el registro existente
```

**Esto significa que un usuario del portal obtiene su registro en `clientes_new` la primera vez que participa en un sorteo**, con `canal=SOCIOSA_PORTAL`.

Si viene por un link de convenio y participa con `?convenio=COCACOLA`, el request lleva `canal=CONVENIO` y `convenio=COCACOLA` — así el convenio queda en la participación aunque no en su perfil base todavía.

### Implicancia para el flujo de convenios

| Situación del usuario | GET /cliente/:dni | Resultado de /clientes/start |
|---|---|---|
| Nuevo, nunca en el sistema | `found: false` | Crea `clientes_new` con convenio=COCACOLA, canal=CONVENIO |
| Portal user que nunca participó en sorteo | `found: false` | Crea `clientes_new` con convenio=COCACOLA, canal=CONVENIO |
| Portal user que ya participó en algún sorteo | `found: true` | Actualiza `clientes_new` existente, agrega convenio=COCACOLA |

---

## Lo que NO hace este flujo

- **No crea cuenta de portal (Keycloak).** El usuario queda registrado en el CRM pero no puede loguearse al portal sin registrarse por separado.
- **No requiere estar logueado.** Es un flujo público, igual que el sitio externo anterior.
- **No modifica el flujo de auth existente.** El onboarding/identity-link del portal quedan intactos.

---

## Modal de verificación para usuarios logueados

Además del flujo público en `/convenio/[slug]`, existe un segundo flujo para usuarios que **ya están logueados** en el portal y llegan por un link de convenio.

### URL de entrada

```
/socios?convenio=COCACOLA
```

Cuando el usuario entra a `/socios` con el query param `?convenio=`, el portal muestra el `ConvenioVerificacionModal` si todavía no verificó su teléfono para ese convenio.

### Componentes involucrados

- `src/app/socios/_SociosPageClient.tsx` — lee el query param `convenio`, controla si mostrar el modal
- `src/components/organisms/convenio/ConvenioVerificacionModal.tsx` — el modal en sí

### Flujo del modal

1. El usuario ve el modal con el input de teléfono vacío (siempre limpio, ver nota abajo)
2. Ingresa su número y hace click en "Recibir mensaje de verificación"
3. El portal llama a `POST /api/legacy/clientes/start` → el CRM envía un mensaje de WhatsApp con un botón **"Validar"**
4. El modal muestra una pantalla de espera con spinner
5. El portal hace polling cada 4 segundos a `GET /api/legacy/cliente/:dni`
6. Cuando `data.convenio === convenio` en la respuesta, el modal se cierra y aparece un toast de éxito

> **Input siempre vacío:** El teléfono ya no se pre-carga del perfil. Esto evita que una sesión anterior de otra cuenta deje un número incorrecto pre-cargado.
> **Sin localStorage:** La verificación del convenio ya no se cachea en `localStorage`. El CRM es la única fuente de verdad. Cada vez que el usuario entra a `/socios?convenio=X` se consulta el CRM para confirmar si ya está registrado — mostrando el skeleton mientras se espera la respuesta.
> **Nota:** El flujo en `/convenio/[slug]` (`ConvenioRegistroView`) todavía usa OTP y está **pendiente de actualizar** al mismo enfoque de polling.

---

## Arquitectura del webhook de Botmaker (flujo "Validar")

Cuando el usuario toca el botón "Validar" en WhatsApp, Botmaker dispara un webhook. La arquitectura tiene dos repos involucrados:

```
Botmaker
   └→ POST notificaciones-fsa /notifications/providers/botmaker/webhook
              │
              ├── Publica business.contact_validation.validated (→ clientes-fsa)
              └── forwardToCrm(body) → POST crm-webservice /webhook  [siempre, sin filtro]
                        │
                        └── Busca verificacion_telefono por teléfono
                            └── applyPending() → escribe clientes_new.convenio
                                (sin mensaje de WhatsApp — el portal lo detecta por polling)
```

> `notificaciones-fsa` forwarda **todos** los eventos de Botmaker al CRM sin filtrar por tipo. El CRM tiene su propia lógica `isValidate` para ignorar eventos que no corresponden. Antes se filtraba en `notificaciones-fsa` con `isValidateNumeroTrigger`, pero la detección era frágil: fallaba si Botmaker enviaba el evento como `MessageEvent` en lugar de `SessionStatusEvent`.

### Variables de entorno necesarias

| Servicio | Variable | Valor |
|---|---|---|
| `portal-clientes-fsa` | `CRM_WEBSERVICE_BASE_URL` | URL del crm-webservice en Railway |
| `notificaciones-fsa` | `CRM_WEBSERVICE_URL` | URL del crm-webservice en Railway |
| `crm-webservice` | `BOTMAKER_ACCESS_TOKEN` | Token de Botmaker |
| `crm-webservice` | `BOTMAKER_BUSINESS_NUMBER` | Número de negocio WhatsApp |
| `crm-webservice` | `BOTMAKER_TEMPLATE_VALIDACION` | Nombre de la plantilla OTP |

### Configuración de Botmaker

En la plataforma Botmaker, canal WhatsApp (`5493518173000`):

```
URL de notificación mensaje entrante:  https://notificaciones-fsa-production.up.railway.app/notifications/providers/botmaker/webhook
URL de notificación estado de mensaje: https://notificaciones-fsa-production.up.railway.app/notifications/providers/botmaker/webhook
URL de notificación mensaje saliente:  (vacía)
```

> Durante desarrollo/testing usar la URL de `notificaciones-fsa-development` en lugar de production.

---

## Incidente: envío masivo de mensajes (2026-06-10)

### Qué pasó

Al deployar cambios en `crm-webservice` y testear el flujo de convenio, varios usuarios reales recibieron **múltiples veces** el mensaje de confirmación "Gracias [NOMBRE]! ✅ Tus datos de SocioSA han sido actualizados".

### Causa

Dos factores combinados:

1. **Botmaker reintenta el webhook automáticamente** cuando el servidor tarda en responder. Si `applyPending` (que escribe en DB, sincroniza con Wibi y llama a clientes-fsa) tarda más de lo esperado, Botmaker reenvía el webhook varias veces en pocos segundos.

2. **Race condition + handler no idempotente**: varios handlers llegaban simultáneamente, todos leían `estado = PENDING_VERIFICATION` antes de que ninguno lo hubiera actualizado, todos pasaban el check y todos llamaban a `sendFinalTemplate`.

Los otros usuarios afectados tenían pendientes activos de flujos previos — el mismo bug les generó spam cuando tocaron "Validar" en sus propios WhatsApp.

### Fix aplicado (2026-06-11)

#### 1. `SELECT FOR UPDATE` en `applyPending` (`crm-webservice/services/pending.service.js`)

La lectura del pendiente se movió **dentro de la transacción** usando `FOR UPDATE`. MySQL bloquea la fila hasta que la transacción commitea. Si dos handlers llegan en paralelo, el segundo espera hasta que el primero termine — cuando el primero commitea con `estado = APPLIED`, el segundo lee ese estado y retorna `false` sin procesar:

```js
await conn.beginTransaction();
const [[pend]] = await conn.execute(
  `SELECT * FROM crm_pendientes WHERE id = ? FOR UPDATE`,
  [pendingId]
);
if (["APPLIED", "BRANCH_REJECTED", "FAILED", "EXPIRED"].includes(String(pend.estado))) {
  await conn.rollback();
  return false; // otro handler ya lo procesó
}
// solo un handler llega acá
```

> Se intentó primero un `UPDATE WHERE estado = 'PENDING_VERIFICATION'` para transicionar a un estado `PROCESSING`, pero el campo `estado` es un `ENUM` en MySQL y `'PROCESSING'` no estaba en la lista — tiraba `WARN_DATA_TRUNCATED`. El `SELECT FOR UPDATE` logra el mismo efecto sin tocar el schema.

#### 2. Eliminación de `sendFinalTemplate` (`crm-webservice/routes/botmakerWebhookV2.js`)

El mensaje de WhatsApp de confirmación se eliminó completamente. No tiene sentido de negocio: el portal comunica el éxito vía polling cuando detecta que `convenio` quedó guardado. El texto también era incorrecto (mencionaba "sorteo"). Eliminarlo de raíz hace imposible que vuelva a generarse spam desde este webhook.

#### 3. `notificaciones-fsa` forwarda siempre al CRM (`notificaciones-fsa/botmaker-webhook.controller.ts`)

Antes se filtraba con `isValidateNumeroTrigger` antes de llamar a `forwardToCrm`. La función fallaba silenciosamente cuando Botmaker enviaba el evento como `MessageEvent` en lugar de `SessionStatusEvent` (la detección de `WaApiExposed` solo funciona en `SessionStatusEvent`). Se simplificó para forwadear siempre — el CRM ya tiene su propia lógica `isValidate` para ignorar lo que no corresponde.

#### 4. Sin localStorage en el portal (`portal-clientes-fsa`)

Se eliminó el uso de `localStorage` para cachear el estado del convenio. Motivo: si otra cuenta usa la misma computadora, el valor cacheado de la cuenta anterior podría saltear el modal incorrectamente. El CRM es la única fuente de verdad y se consulta siempre al montar — mostrando el skeleton mientras se espera la respuesta.

#### 5. Fix en `buscarClientePorDNI` (`crm-webservice/controllers/clienteController.js`)

El endpoint `GET /cliente/:dni` consultaba Plex primero y retornaba `{ found: false }` inmediatamente si el DNI no existía en Plex, sin llegar a consultar `clientes_new`. Un usuario nuevo registrado por convenio solo existe en `clientes_new` inicialmente (Plex recibe la sincronización después). Esto hacía que el polling del portal nunca detectara que el convenio fue guardado.

Fix: se consulta `clientes_new` antes del check de Plex. Si el usuario no está en Plex pero sí en `clientes_new`, se retorna `{ found: true, convenio }` igual.

#### 6. Toast de confirmación en el portal (`portal-clientes-fsa/_SociosPageClient.tsx`)

Cuando el polling detecta que el convenio quedó guardado y cierra el modal, se muestra un toast de éxito usando `useGlobalToast` con el mensaje "¡Verificación completada!".

#### 7. Script `npm run build` en `crm-webservice`

Se agregó `scripts/check-syntax.js` que corre `node --check` sobre todos los `.js` del proyecto (excluyendo `node_modules`). Permite verificar sintaxis antes de deployar sin necesidad de levantar el servidor.

### Checklist de deploys

- [x] `crm-webservice`: `botmakerWebhookV2.js` (race condition fix + eliminación de sendFinalTemplate), `pending.service.js` (SELECT FOR UPDATE), `clienteController.js` (found desde clientes_new)
- [x] `notificaciones-fsa`: `botmaker-webhook.controller.ts` (forward siempre al CRM)
- [ ] Actualizar URLs de Botmaker de `development` a `production` cuando se quiera ir a prod
- [ ] Actualizar `ConvenioRegistroView` para usar polling en lugar de OTP (el flujo `/convenio/[slug]` todavía usa código numérico que ya no funciona con WhatsApp)

---

## Cómo agregar mensaje de confirmación por WhatsApp en el futuro

Si en algún momento se desea que el usuario reciba un mensaje de WhatsApp al completar la verificación del convenio (por ejemplo: "¡Listo! Quedaste registrado en el convenio COCACOLA"), el mecanismo ya está en el repo (`sendTemplate` / `sendFinalTemplate` en `crm-webservice/services/botmakerService.js`). Los pasos son:

### 1. Crear una plantilla de WhatsApp aprobada en Botmaker

La plantilla debe estar aprobada por Meta antes de poder usarse. Debe tener texto sin variables dinámicas ni lógica de botones (solo texto de confirmación). Registrar el nombre de la plantilla como variable de entorno en `crm-webservice` (ej: `BOTMAKER_TEMPLATE_CONVENIO_CONFIRMACION`).

### 2. Llamar a `sendTemplate` después de `applyPending` en `botmakerWebhookV2.js`

```js
// En crm-webservice/routes/botmakerWebhookV2.js
// Después de que applyPending resuelva sin error:

try {
  await applyPending({ pendingId: pend.id });
  console.log("✅ Pendiente aplicado con éxito.");

  // Opcional: notificar al usuario por WhatsApp
  const nombreCliente = payload?.Nombre?.split(" ")[0] ?? "Cliente";
  await sendTemplate(telefonoE164, nombreCliente);  // o una función específica para convenio
  console.log("📤 Mensaje de confirmación enviado.");
} catch (err) {
  // ...
}
```

### 3. Por qué esto es seguro (no generará spam)

Con el `SELECT FOR UPDATE` en `applyPending`, solo **un** handler llega al bloque de `sendTemplate`. Los retries de Botmaker que lleguen mientras el primero está procesando esperan el lock y luego ven `estado = APPLIED` — retornan sin llamar a `sendTemplate`. No hay riesgo de duplicados.

### 4. Verificar antes de habilitar

- Confirmar que la plantilla está aprobada en Botmaker (estado "Active")
- Testear con un número propio antes de ir a producción
- Revisar que `BOTMAKER_ACCESS_TOKEN` y `BOTMAKER_BUSINESS_NUMBER` están seteados correctamente en Railway

---

## Evolución futura posible

Si en el futuro se quiere que el convenio también se guarde cuando un usuario se registra por el flujo normal de portal (onboarding), habría que:

1. Agregar `convenio` como campo opcional en el BFF (`/api/v2/auth/identity-link/start`)
2. Pasarlo desde el BFF a `clientes-fsa` en el `upsert-and-link`
3. Guardar el convenio en la cookie antes del auth y leerlo al completar el identity-link

Eso requiere cambios en bff-gateway y clientes-fsa, pero es perfectamente factible como mejora incremental.
