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

1. El usuario ve el modal con su teléfono pre-cargado (del perfil del portal)
2. Confirma o cambia el número y hace click en "Recibir mensaje de verificación"
3. El portal llama a `POST /api/legacy/clientes/start` → el CRM envía un mensaje de WhatsApp con un botón **"Validar"**
4. El modal muestra una pantalla de espera con spinner
5. El portal hace polling cada 4 segundos a `GET /api/legacy/cliente/:dni`
6. Cuando `data.convenio === convenio` en la respuesta, el modal se cierra y se marca el convenio como completado en `localStorage`

> **Nota:** El paso 3 ya NO usa OTP (código numérico). WhatsApp envía un botón interactivo "Validar", no un código. El flujo en `/convenio/[slug]` (`ConvenioRegistroView`) todavía usa OTP y está **pendiente de actualizar** al mismo enfoque de polling.

---

## Arquitectura del webhook de Botmaker (flujo "Validar")

Cuando el usuario toca el botón "Validar" en WhatsApp, Botmaker dispara un webhook. La arquitectura tiene dos repos involucrados:

```
Botmaker
   └→ POST notificaciones-fsa /notifications/providers/botmaker/webhook
              │
              ├── Detecta WaApiExposed.d === "validar_numero"
              ├── Publica business.contact_validation.validated (→ clientes-fsa)
              └── forwardToCrm(body) → POST crm-webservice /webhook
                        │
                        └── Busca verificacion_telefono por teléfono
                            └── applyPending() → escribe clientes_new.convenio
                                └── sendFinalTemplate() → WhatsApp de confirmación
```

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

1. **Botmaker reintenta el webhook automáticamente** cuando el servidor tarda en responder (la función `applyPending` hace varias operaciones: escribe en DB, sincroniza con Wibi, llama a clientes-fsa). Si la respuesta tarda más de lo esperado, Botmaker reenvía el webhook varias veces en pocos segundos.

2. **El handler no era idempotente**: aunque detectaba que el pendiente ya estaba en estado `APPLIED`, igual llegaba al bloque de `sendFinalTemplate` y mandaba el mensaje en cada retry.

```js
// Código viejo — bug
if (pend.estado === "APPLIED") {
  console.log("ya procesado")  // no reprocesaba...
}
// ...pero siempre mandaba el template:
await sendFinalTemplate(telefonoE164, nombreCliente);  // ← corría en cada retry
```

Los otros usuarios que recibieron el mensaje no fueron afectados por el test — cada uno había tocado "Validar" en su propio WhatsApp de forma independiente (tenían pendientes activos de flujos previos), y el mismo bug les generó spam a ellos también.

### Fix aplicado (2026-06-11)

Se hicieron tres grupos de cambios:

#### 1. Claim atómico en el webhook (`crm-webservice/routes/botmakerWebhookV2.js`)

El check de estado terminal no alcanzaba porque varios handlers podían leer `PENDING_VERIFICATION` simultáneamente antes de que ninguno lo actualizara. Se reemplazó por un `UPDATE` atómico con `WHERE estado = 'PENDING_VERIFICATION'` — MySQL garantiza que solo un handler obtiene `affectedRows = 1` y los demás retornan inmediatamente:

```js
const [claimResult] = await dbRailway.execute(
  `UPDATE crm_pendientes
      SET estado = 'PROCESSING', updated_at = NOW()
    WHERE id = ? AND estado = 'PENDING_VERIFICATION'`,
  [pend.id]
);
if (claimResult.affectedRows === 0) {
  return res.json({ ok: true, message: "Retry ignorado" });
}
```

#### 2. Eliminación de `sendFinalTemplate` (`crm-webservice/routes/botmakerWebhookV2.js`)

El mensaje "Gracias [NOMBRE]! ✅ Tus datos de SocioSA han sido actualizados" se eliminó completamente del webhook. No tiene sentido de negocio en este flujo: el portal ya comunica el éxito vía polling cuando detecta que `convenio` quedó guardado en el CRM. Además el texto del mensaje era incorrecto (mencionaba "sorteo").

#### 3. Sin localStorage en el portal (`portal-clientes-fsa`)

Se eliminó el uso de `localStorage` para cachear si el usuario ya completó el convenio. El CRM es la única fuente de verdad. Esto evita falsos positivos cuando otra cuenta usa la misma computadora o cuando el mismo usuario intenta un convenio diferente.

Adicionalmente, `_SociosPageClient.tsx` ahora muestra el skeleton de carga mientras consulta el CRM al montar, en lugar de mostrar el modal de verificación antes de saber si el usuario ya está registrado.

### Checklist pendiente para producción

- [ ] Deployar cambios de `crm-webservice` (entity fix, clienteController, botmakerWebhookV2 con claim atómico y eliminación de sendFinalTemplate)
- [ ] Deployar cambios de `notificaciones-fsa` (forwardToCrm en botmaker-webhook.controller.ts)
- [ ] Actualizar URLs de Botmaker de `development` a `production`
- [ ] Confirmar variable `CRM_WEBSERVICE_URL` en Railway de notificaciones-fsa apunta al crm-webservice correcto
- [ ] Actualizar `ConvenioRegistroView` para usar polling en lugar de OTP (el flujo `/convenio/[slug]` todavía usa código numérico que ya no funciona con WhatsApp)

---

## Evolución futura posible

Si en el futuro se quiere que el convenio también se guarde cuando un usuario se registra por el flujo normal de portal (onboarding), habría que:

1. Agregar `convenio` como campo opcional en el BFF (`/api/v2/auth/identity-link/start`)
2. Pasarlo desde el BFF a `clientes-fsa` en el `upsert-and-link`
3. Guardar el convenio en la cookie antes del auth y leerlo al completar el identity-link

Eso requiere cambios en bff-gateway y clientes-fsa, pero es perfectamente factible como mejora incremental.
