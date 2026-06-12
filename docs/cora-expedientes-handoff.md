# CORA Expedientes Handoff

## Objetivo

Habilitar que un cliente autenticado en CORA (`portal-clientes-fsa`) pueda:

- crear su propio expediente/crónico
- elegir productos
- elegir fecha objetivo de entrega
- elegir domicilio o sucursal según el medio de entrega
- editar su expediente activo
- ver confirmación post-alta

La intención fue **reutilizar la lógica actual de `cronicos-fsa`** para que, una vez creado el expediente, siga funcionando igual que hoy:

- creación de items
- planificación del primer ciclo
- creación del evento inicial
- aparición en agenda/calendario de crónicos

## Repos involucrados

- Portal CORA:
  - `C:\Users\Usuario\Documents\front-fsa\portal-clientes-fsa`
- BFF portal:
  - `C:\Users\Usuario\Documents\front-fsa\BFF\bff-cliente-web`
- Backend crónicos:
  - `C:\Users\Usuario\Documents\front-fsa\Cronicos\cronicos-fsa`

## Estrategia elegida

No se reimplementó agenda ni lógica de negocio de expedientes en el portal.

Se armó este flujo:

1. `portal-clientes-fsa` muestra UI de alta/edición.
2. `portal-clientes-fsa` llama a `bff-cliente-web`.
3. `bff-cliente-web` valida contexto del cliente autenticado.
4. `bff-cliente-web` llama a endpoints portal propios en `cronicos-fsa`.
5. `cronicos-fsa` reutiliza los mismos casos de uso actuales para crear/editar expediente.

Esto evita depender de endpoints de backoffice como `/productos` o `/expedientes/full` con permisos de admin/backoffice.

## Reglas de negocio acordadas

- El cliente puede crear más de un expediente.
- El cliente puede editar su expediente.
- El cliente puede elegir cualquier producto disponible.
- El cliente puede elegir médico y afiliación, pero de los datos ya cargados.
- Debe tener al menos un contacto verificado para crear o editar.
- Debe poder definir una "fecha objetivo de entrega".
- Debe poder elegir:
  - `domicilio` si `medioEntrega = ENVIO_DOMICILIO`
  - `sucursal` si `medioEntrega = RETIRA_SUCURSAL`

## Campo de fecha objetivo

En la UI se muestra como:

- `Fecha objetivo de entrega`

En backend se mapea a:

- `proximaFechaEntregaForzada`

Eso ya existía en `cronicos-fsa` y es el campo que termina afectando la `fechaEntregaObjetivo` del ciclo.

## Qué se cambió en cada repo

### 1. `portal-clientes-fsa`

Se agregó/ajustó:

- vista de gestión de expedientes
- creación y edición desde CORA
- selección de productos
- búsqueda de sucursales
- selección de domicilio o sucursal según medio de entrega
- confirmación post-alta
- refresh real de expedientes luego del alta/edición

Archivos clave:

- [src/components/organisms/home/ExpedientesManagementView.tsx](/C:/Users/Usuario/Documents/front-fsa/portal-clientes-fsa/src/components/organisms/home/ExpedientesManagementView.tsx:1)
- [src/lib/use-portal-expedientes.ts](/C:/Users/Usuario/Documents/front-fsa/portal-clientes-fsa/src/lib/use-portal-expedientes.ts:1)
- [src/app/api/portal/me/expedientes/route.ts](/C:/Users/Usuario/Documents/front-fsa/portal-clientes-fsa/src/app/api/portal/me/expedientes/route.ts:1)
- [src/app/api/portal/me/expedientes/[expedienteId]/route.ts](/C:/Users/Usuario/Documents/front-fsa/portal-clientes-fsa/src/app/api/portal/me/expedientes/[expedienteId]/route.ts:1)
- [src/app/api/portal/me/productos/route.ts](/C:/Users/Usuario/Documents/front-fsa/portal-clientes-fsa/src/app/api/portal/me/productos/route.ts:1)
- [src/app/api/portal/me/sucursales/search/route.ts](/C:/Users/Usuario/Documents/front-fsa/portal-clientes-fsa/src/app/api/portal/me/sucursales/search/route.ts:1)
- [src/types/portal-expediente-mutations.ts](/C:/Users/Usuario/Documents/front-fsa/portal-clientes-fsa/src/types/portal-expediente-mutations.ts:1)
- [src/types/portal-productos.ts](/C:/Users/Usuario/Documents/front-fsa/portal-clientes-fsa/src/types/portal-productos.ts:1)
- [src/types/portal-sucursales.ts](/C:/Users/Usuario/Documents/front-fsa/portal-clientes-fsa/src/types/portal-sucursales.ts:1)

Comportamiento implementado:

- exige contacto verificado
- crea expediente con `items[]`
- envía `domicilioEntregaId` o `sucursalEntregaId`
- luego del alta refresca expedientes y muestra resumen de confirmación

### 2. `bff-cliente-web`

Se agregó/ajustó:

- `POST /portal/me/expedientes`
- `PATCH /portal/me/expedientes/:expedienteId`
- `GET /portal/me/productos`
- `GET /portal/me/sucursales/search`

Archivos clave:

- [src/infrastructure/Portal/controllers/portal-me.controller.ts](/C:/Users/Usuario/Documents/front-fsa/BFF/bff-cliente-web/src/infrastructure/Portal/controllers/portal-me.controller.ts:1)
- [src/infrastructure/Portal/dto/portal-mutations.request.dto.ts](/C:/Users/Usuario/Documents/front-fsa/BFF/bff-cliente-web/src/infrastructure/Portal/dto/portal-mutations.request.dto.ts:1)
- [src/infrastructure/Portal/adapters/clientes-portal-me-mutations.adapter.ts](/C:/Users/Usuario/Documents/front-fsa/BFF/bff-cliente-web/src/infrastructure/Portal/adapters/clientes-portal-me-mutations.adapter.ts:1)
- [src/infrastructure/Portal/adapters/portal-me-query.adapter.ts](/C:/Users/Usuario/Documents/front-fsa/BFF/bff-cliente-web/src/infrastructure/Portal/adapters/portal-me-query.adapter.ts:1)

Validaciones implementadas en BFF:

- toma `clienteId` del `clienteContext`
- valida que `contactoId` pertenezca al cliente
- valida que el contacto esté verificado
- valida que la afiliación pertenezca al cliente
- valida que el domicilio pertenezca al cliente cuando aplica
- valida ownership del expediente en update

Además:

- el BFF dejó de consumir endpoints de backoffice de crónicos
- ahora consume endpoints portal propios:
  - `/portal/me/productos`
  - `/portal/me/sucursales/search`
  - `/portal/me/expedientes`
  - `/portal/me/expedientes/:id`

### 3. `cronicos-fsa`

Se agregó/ajustó:

- soporte create para `domicilioEntregaId` y `sucursalEntregaId`
- soporte create simple y create full propagando esos campos
- endpoints portal propios autenticados para productos, sucursales, create y patch

Archivos clave:

- [src/infrastructure/Expediente/dto/expediente.request.dto.ts](/C:/Users/Usuario/Documents/front-fsa/Cronicos/cronicos-fsa/src/infrastructure/Expediente/dto/expediente.request.dto.ts:1)
- [src/infrastructure/Expediente/controllers/expediente.controller.ts](/C:/Users/Usuario/Documents/front-fsa/Cronicos/cronicos-fsa/src/infrastructure/Expediente/controllers/expediente.controller.ts:1)
- [src/application/Expedientes/Expediente/commands/dto/create-expediente.command.ts](/C:/Users/Usuario/Documents/front-fsa/Cronicos/cronicos-fsa/src/application/Expedientes/Expediente/commands/dto/create-expediente.command.ts:1)
- [src/application/Expedientes/Expediente/commands/handlers/create-expediente.handler.ts](/C:/Users/Usuario/Documents/front-fsa/Cronicos/cronicos-fsa/src/application/Expedientes/Expediente/commands/handlers/create-expediente.handler.ts:1)
- [src/application/Expedientes/Expediente/use-cases/create-expediente-with-items.usecase.ts](/C:/Users/Usuario/Documents/front-fsa/Cronicos/cronicos-fsa/src/application/Expedientes/Expediente/use-cases/create-expediente-with-items.usecase.ts:1)
- [src/infrastructure/PortalCliente/controllers/portal-me-cronicos.controller.ts](/C:/Users/Usuario/Documents/front-fsa/Cronicos/cronicos-fsa/src/infrastructure/PortalCliente/controllers/portal-me-cronicos.controller.ts:1)
- [src/infrastructure/PortalCliente/portal-cliente.module.ts](/C:/Users/Usuario/Documents/front-fsa/Cronicos/cronicos-fsa/src/infrastructure/PortalCliente/portal-cliente.module.ts:1)

Endpoints portal nuevos en `cronicos-fsa`:

- `GET /portal/me/productos`
- `GET /portal/me/sucursales/search`
- `POST /portal/me/expedientes`
- `PATCH /portal/me/expedientes/:id`

Importante:

- estos endpoints **no reemplazan** los endpoints viejos de backoffice
- solo agregan una vía propia para portal/CORA
- reutilizan la misma lógica de negocio

## Compatibilidad con el flujo viejo de crónicos

La intención explícita fue no romper el flujo existente.

Lo que se hizo fue aditivo:

- no se reemplazó `/expedientes/full`
- no se reemplazó `/productos`
- no se tocó la lógica de planificación
- no se tocó agenda/calendario

Posibles diferencias solo si un flujo viejo ya venía mandando combinaciones inválidas:

- `medioEntrega = ENVIO_DOMICILIO` sin `domicilioEntregaId`
- `medioEntrega = RETIRA_SUCURSAL` sin `sucursalEntregaId`

En esos casos ahora el dominio valida mejor.

## Por qué debería seguir apareciendo en agenda/calendario

Porque la creación real del expediente sigue ocurriendo en `cronicos-fsa` usando el mismo caso de uso que ya:

- crea expediente
- crea items
- planifica el primer ciclo
- crea el evento inicial

Eso es lo que después consume la agenda actual.

## Errores encontrados durante la implementación

### 1. Búsqueda de productos devolvía 400 por `paginanro` y `paginacant`

Causa:

- el BFF recibía query params como string
- el DTO los validaba como enteros sin convertirlos

Fix:

- se agregó conversión explícita con `@Type(() => Number)` en:
  - [portal-mutations.request.dto.ts](/C:/Users/Usuario/Documents/front-fsa/BFF/bff-cliente-web/src/infrastructure/Portal/dto/portal-mutations.request.dto.ts:1)

### 2. Búsqueda de productos devolvía 403 `Missing client role(s) on cronicos-fsa`

Causa:

- el BFF estaba llamando endpoints de backoffice de `cronicos-fsa`
- esos endpoints exigían permisos como `producto:read` o `expediente:write`

Fix:

- se crearon endpoints portal propios en `cronicos-fsa`
- el BFF fue repointado a esos paths nuevos

### 3. Búsqueda de productos devolvía 404 `Cannot GET /portal/me/productos`

Posible causa:

- `cronicos-fsa` no reiniciado
- instancia vieja levantada
- `BFF` apuntando a otra URL/base distinta

## Qué revisar para probar local

Servicios mínimos:

- `portal-clientes-fsa`
- `bff-cliente-web`
- `cronicos-fsa`

Probablemente también:

- `clientes-fsa`, porque el BFF consulta perfil/contactos/domicilios/afiliaciones

Revisar:

- variables de entorno del portal
- base URL que usa el BFF para `cronicos-fsa`
- que `cronicos-fsa` esté levantado con el código nuevo

## Orden sugerido de prueba

1. probar directo en `cronicos-fsa`
   - `GET /portal/me/productos`
   - `GET /portal/me/sucursales/search`
2. probar directo en `bff-cliente-web`
   - `GET /portal/me/productos`
   - `GET /portal/me/sucursales/search`
3. crear expediente desde BFF con:
   - `ENVIO_DOMICILIO`
4. crear expediente desde BFF con:
   - `RETIRA_SUCURSAL`
5. probar create desde CORA
6. verificar agenda/calendario en crónicos
7. probar edición del expediente activo desde CORA

## Curls de referencia

### `cronicos-fsa`

Buscar productos:

```bash
curl --location "http://localhost:3000/portal/me/productos?busqueda=amoxidal&paginanro=1&paginacant=10" \
  --header "Authorization: Bearer TOKEN"
```

Buscar sucursales:

```bash
curl --location "http://localhost:3000/portal/me/sucursales/search?q=palermo&limit=10" \
  --header "Authorization: Bearer TOKEN"
```

### `bff-cliente-web`

Buscar productos:

```bash
curl --location "http://localhost:3001/api/v1/portal/me/productos?busqueda=amoxidal&paginanro=1&paginacant=10" \
  --header "Authorization: Bearer TOKEN"
```

## Estado actual

Implementación hecha:

- portal/CORA listo a nivel UI y proxies
- BFF listo con validaciones y forwarding
- `cronicos-fsa` listo con endpoints portal propios y soporte de create/update

Validación hecha durante la implementación:

- `portal-clientes-fsa`: `tsc --noEmit` y `eslint`
- `bff-cliente-web`: `tsc --noEmit -p tsconfig.build.json` y `eslint`
- `cronicos-fsa`: `tsc --noEmit -p tsconfig.build.json` y `eslint`

## Lo próximo si algo falla

Si falla con `404`:

- revisar que `cronicos-fsa` esté reiniciado
- revisar que el BFF apunte a la instancia correcta

Si falla con `403`:

- revisar roles/permisos del token del portal
- confirmar que el BFF ya no esté usando endpoints de backoffice

Si create funciona pero no aparece en agenda:

- revisar que `CreateExpedienteWithItemsUseCase` haya ejecutado la planificación
- revisar logs de `planificarProximoCiclo`

## Resumen corto para otro agente

Se está implementando alta/edición de expedientes desde CORA para cliente autenticado, reutilizando el motor de `cronicos-fsa`. El portal ya permite seleccionar productos, fecha objetivo, domicilio/sucursal, y exige contacto verificado. El BFF valida ownership y reenvía a `cronicos-fsa`. En `cronicos-fsa` se agregaron endpoints portal autenticados (`/portal/me/*`) para no depender de permisos de backoffice. La meta es que el expediente creado desde CORA entre por el mismo flujo que ya planifica ciclos y por eso aparezca en agenda/calendario sin lógica adicional.
