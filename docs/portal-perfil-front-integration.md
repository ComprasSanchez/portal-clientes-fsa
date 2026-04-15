# Integracion de portal/me/perfil en el front

## Objetivo

Se agrego en `portal-clientes-fsa` la integracion necesaria para consumir el endpoint del BFF:

- `GET /api/v1/portal/me/perfil`

La idea fue usar ese perfil para dejar de mostrar datos hardcodeados en la UI y reutilizar esa informacion en:

- saludo de `Home`
- saludo de `Socios`
- tarjeta de credencial
- resumen rapido de perfil en `Socios`
- vista completa `Mi perfil`
- estados de afiliacion cuando no existe numero real

Tambien se dejo un logout local simple para limpiar la sesion del front.

## Contexto funcional

Antes de este cambio, varias vistas del front mostraban datos fijos como:

- `Hola, Luciana`
- `AF-548213-09`
- mail, telefono y documento mockeados

Ahora esos datos salen de una llamada interna del front a:

- `/api/portal/me/perfil`

Y esa ruta del front hace proxy al BFF real:

- `${NEXT_PUBLIC_FSA_BFF_CLIENTE_URL}/api/v1/portal/me/perfil`

## Flujo implementado

El flujo actual es este:

1. La UI cliente llama a `/api/portal/me/perfil`.
2. El Route Handler de Next obtiene un Bearer server-side si la request no trae `Authorization`.
3. El Route Handler reenvia la request al BFF.
4. El Route Handler reenvia headers utiles:
  - `Authorization: Bearer ...`
  - `Cookie` si existe
   - `x-request-id`
5. La respuesta del BFF se normaliza en helpers del front.
6. La UI consume un resumen simple del perfil y renderiza fallbacks cuando falta informacion.

## Archivos creados

### API proxy al BFF

- `src/app/api/portal/me/perfil/route.ts`

Responsabilidad:

- exponer `/api/portal/me/perfil` en el front
- leer `NEXT_PUBLIC_FSA_BFF_CLIENTE_URL`
- resolver un Bearer tecnico server-side cuando hace falta
- reenviar headers relevantes al BFF
- devolver la respuesta JSON tal cual llega del upstream

### Helper de token tecnico

- `src/app/api/_lib/proxy.ts`

Responsabilidad:

- pedir `access_token` a `FSA_AUTH_TOKEN_URL`
- enviar `grant_type=password` como `application/x-www-form-urlencoded`
- cachear el token en memoria hasta cerca de su vencimiento
- devolver `Authorization: Bearer ...` a los proxies que lo necesiten

### Logout local del front

- `src/app/api/auth/logout/route.ts`

Responsabilidad:

- limpiar cookies locales de sesion del sitio
- hoy borra:
  - `sid`
  - `trusted_device_token`

Nota:

- este logout es local al front
- no llama un endpoint remoto de logout porque en este repo no habia uno ya implementado

### Tipos del perfil

- `src/types/portal-profile.ts`

Responsabilidad:

- tipar el shape minimo del perfil que devuelve el BFF
- modelar `contactos`, `afiliaciones` y `domicilios`
- definir dos vistas normalizadas:
  - `PortalPerfilSummary`
  - `PortalPerfilDetails`

### Helpers de normalizacion

- `src/lib/portal-profile.ts`

Responsabilidad:

- resolver el nombre visible del usuario
- elegir contacto principal de email y telefono
- elegir afiliacion preferida
- elegir domicilio preferido
- formatear fecha y direccion
- devolver estructuras listas para UI

Funciones importantes:

- `getPortalDisplayName`
- `getPortalPerfilSummary`
- `getPortalPerfilDetails`

### Hook cliente para cargar el perfil

- `src/lib/use-portal-perfil.ts`

Responsabilidad:

- hacer `fetch` contra `/api/portal/me/perfil`
- manejar estado:
  - `perfil`
  - `summary`
  - `isLoading`
  - `error`
- tolerar `401` y `403` sin romper la UI

### Contexto cliente para reutilizar el perfil

- `src/lib/portal-perfil-context.tsx`

Responsabilidad:

- cargar el perfil una sola vez por area funcional
- exponer `perfil`, `summary`, `isLoading` y `error`
- evitar repetir la misma llamada en `Home` y `Socios`

## Archivos modificados

### Base URL robusta para APIs

- `src/app/api/_lib/proxy.ts`

Se endurecio `getRequiredBaseUrl` para que haga:

- `trim()`
- remocion de comillas simples o dobles accidentales
- remocion del slash final

Esto se hizo porque la variable `NEXT_PUBLIC_FSA_BFF_CLIENTE_URL` estaba mal cargada con comillas en `.env` y eso generaba:

- `TypeError: Failed to parse URL from ...`

### Home

- `src/app/home/page.tsx`
- `src/app/home/layout.tsx`
- `src/components/organisms/home/HomeViews.tsx`
- `src/components/molecules/side-bar/Sidebar.tsx`

Se cambio para que:

- use `PortalPerfilProvider`
- muestre `summary.displayName`
- muestre `summary.affiliateNumber`
- muestre documento, mail y telefono en el dashboard de CORA
- recupere `Mi perfil` dentro del menu lateral y accesos rapidos de CORA
- use logout real del front via `/api/auth/logout`

### Socios

- `src/app/socios/page.tsx`
- `src/app/socios/layout.tsx`
- `src/components/organisms/socios/SociosViews.tsx`
- `src/types/socios.ts`

Se cambio para que:

- use `PortalPerfilProvider`
- muestre saludo real
- muestre documento, mail, telefono y afiliacion reales
- recupere la vista `mi-cuenta`
- use logout real del front via `/api/auth/logout`

### Vista Mi perfil

- `src/components/organisms/profile/ProfileView.tsx`
- `src/components/organisms/profile/ProfileView.module.scss`

Se cambio para que:

- deje de usar datos mockeados
- reciba `perfil` por props
- derive los datos visuales desde `getPortalPerfilDetails()`
- use variantes por canal:
  - `variant="cora"` mantiene la tarjeta simple de afiliacion
  - `variant="socios"` habilita la tarjeta ampliada con CTA y modal
- agregue un modal cliente de `Agregar Nueva Afiliacion` solo para `SocioSA`
- deje una previsualizacion local de la afiliacion cargada mientras no exista persistencia real

Nota:

- en `CORA`, la tarjeta de afiliacion se dejo como estaba antes para no alterar esa experiencia
- en `SocioSA`, el modal hoy es solo visual/local y no persiste en backend

### Fallback de afiliacion corregido

- `src/lib/portal-profile.ts`

Se cambio para que:

- `affiliateNumber` salga solo de `afiliaciones[].nroAfiliado`
- no use `customerCode` como fallback de numero de afiliado

Esto se hizo porque habia perfiles donde `afiliaciones` venia vacio y la UI terminaba mostrando un codigo que no representaba una afiliacion real.

## Variables de entorno

La variable necesaria para esta integracion es:

```env
NEXT_PUBLIC_FSA_BFF_CLIENTE_URL=https://bff-cliente-web-develop.up.railway.app
FSA_AUTH_TOKEN_URL=https://fsa-dev.up.railway.app/api/v1/auth/token
FSA_AUTH_TOKEN_USERNAME=faridd
FSA_AUTH_TOKEN_PASSWORD=12345678
```

Importante:

- no debe tener comillas extra
- las credenciales del token deben quedar en variables server-side y no en `NEXT_PUBLIC_*`
- si se cambia el `.env`, hay que reiniciar el server de Next

## Fallbacks definidos

Para evitar que la UI se rompa si faltan datos en el perfil, se usan estos fallbacks:

- nombre: `Usuario`
- afiliacion en credenciales: `Sin numero de afiliado`
- estado de afiliacion sin obra social: mensaje explicativo + CTA a `Mi perfil`
- documento: `Sin dato`
- mail: `Sin dato`
- telefono: `Sin dato`
- fecha: `Sin dato`
- direccion: `Sin dato`

## Comportamiento actual por canal

### CORA

- muestra saludo, credencial y resumen de `Mi perfil` con datos reales
- expone la vista `Mi perfil` desde sidebar y quick access
- mantiene la tarjeta de afiliacion simple dentro de `Mi perfil`
- no muestra modal de alta de afiliacion

### SocioSA

- muestra saludo, credencial y resumen de `Mi perfil` con datos reales
- cuando falta afiliacion real, muestra estado vacio con copy explicativo
- dentro de `Mi perfil`, permite abrir el modal `Agregar Nueva Afiliacion`
- el guardado del modal hoy solo actualiza la UI local y no persiste

## Riesgo tecnico pendiente

Hay un punto importante a validar en ambiente:

- este front maneja sesion principalmente con cookie `sid`
- el BFF de cliente usa autenticacion protegida del lado backend

El proxy actual reenvia:

- `Authorization`
- `Cookie`
- `x-request-id`

Ahora el front ya puede resolver ese Bearer tecnico contra `FSA_AUTH_TOKEN_URL` cuando la request original no trae uno. Si en algun ambiente el BFF necesita identidad del usuario final y no un token tecnico compartido, va a hacer falta un puente adicional entre la sesion del front y un token por usuario.

En otras palabras: la integracion de UI ya esta hecha y el Bearer tecnico cubre el caso actual, pero la autenticacion backend puede requerir ajuste si luego se exige impersonacion o token por usuario.

## Error encontrado durante la implementacion

Se encontro este problema:

- `proxy_failure`
- detalle: `Failed to parse URL from ...`

Causa:

- `NEXT_PUBLIC_FSA_BFF_CLIENTE_URL` estaba escrita con comillas incorrectas en `.env`

Correccion aplicada:

- se corrigio el valor en `.env`
- se robustecio el helper `getRequiredBaseUrl`

## Validacion hecha

Se valido lo siguiente:

- los archivos tocados no quedaron con errores de TypeScript
- `npm.cmd run lint` no dejo errores en lo agregado/modificado por esta integracion

Quedaron warnings preexistentes y no relacionados en el repo:

- `src/app/api/order-cycles/parent-orders/[orderId]/status/route.ts`

## Como probar rapido

1. Configurar `NEXT_PUBLIC_FSA_BFF_CLIENTE_URL`.
2. Configurar `FSA_AUTH_TOKEN_URL`, `FSA_AUTH_TOKEN_USERNAME` y `FSA_AUTH_TOKEN_PASSWORD`.
3. Reiniciar el front.
4. Iniciar sesion.
5. Abrir `/home`.
6. Verificar que el saludo muestre el nombre real.
7. Verificar que la credencial muestre numero de afiliacion real o `Sin numero de afiliado` segun el perfil.
8. Abrir `/socios`.
9. Verificar el saludo, panel resumen y `Mi perfil`.
10. Si no hay afiliacion real, abrir `Mi perfil` en `SocioSA` y probar el modal `Agregar Nueva Afiliacion`.
11. Verificar que la carga del modal solo impacta localmente en la UI.
12. Probar `Cerrar sesion` y validar que redirige a `/`.

## Proximos pasos sugeridos

Si se retoma este trabajo despues, los siguientes pasos mas naturales son:

1. Confirmar en ambiente si la autenticacion hacia el BFF funciona solo con cookie o si necesita Bearer explicito.
2. Si hace falta, implementar el puente de sesion a token para el proxy `/api/portal/me/perfil`.
3. Si existe endpoint de afiliaciones, conectar el modal de `SocioSA` para persistir altas reales.
4. Si el producto lo pide, agregar loading visible o mensaje de error en UI cuando falle la carga del perfil.
5. Si existe endpoint de update en backend, volver a habilitar edicion real de `Mi perfil` con persistencia.