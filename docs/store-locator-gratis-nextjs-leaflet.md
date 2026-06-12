# Store Locator gratis en Next.js

## Objetivo

La idea es crear una sección para la web donde el usuario pueda ver todas las sucursales de una empresa en un mapa, seleccionar una sucursal y obtener información útil como dirección, teléfono, WhatsApp, horarios y botón de “Cómo llegar”.

El estilo visual puede inspirarse en Mapbox, pero sin usar Mapbox ni servicios pagos al inicio.

---

## Tecnología recomendada

Para evitar costos, la opción recomendada es:

```txt
Next.js
+ React
+ TypeScript
+ Leaflet
+ React Leaflet
+ OpenStreetMap
+ CSS / SCSS / Tailwind
```

### ¿Qué hace cada tecnología?

### Next.js

Sería la base de la página web.

Permite crear la página de sucursales, separar componentes, manejar estilos y conectar con datos propios.

---

### React

Sirve para dividir la interfaz en componentes reutilizables.

Por ejemplo:

```txt
StoreLocator
MapView
BranchList
BranchCard
SearchBox
SelectedBranchCard
```

---

### TypeScript

Sirve para tipar bien los datos de las sucursales.

Por ejemplo, cada sucursal debería tener datos como:

```txt
id
nombre
dirección
barrio
teléfono
WhatsApp
horarios
latitud
longitud
servicios
estado
```

Esto ayuda a evitar errores cuando el proyecto crece.

---

### Leaflet

Leaflet es la librería que permite mostrar el mapa interactivo.

Con Leaflet se pueden agregar:

```txt
- Marcadores/pins
- Popups
- Capas de mapa
- Eventos de click
- Zoom
- Movimiento del mapa
- Iconos personalizados
```

---

### React Leaflet

React Leaflet permite usar Leaflet de forma más cómoda dentro de React/Next.js.

En vez de manejar todo manualmente, permite usar componentes como:

```txt
MapContainer
TileLayer
Marker
Popup
```

---

### OpenStreetMap

OpenStreetMap aporta el mapa base.

Es una alternativa libre a Google Maps o Mapbox.

Importante: OpenStreetMap es libre, pero sus servidores públicos de tiles no están pensados para usos muy masivos. Para una web chica o mediana puede servir para empezar, pero si la página crece mucho conviene usar un proveedor de tiles dedicado o alojar tiles propios.

---

## Paquetes a instalar

Para una versión inicial con Leaflet y React Leaflet:

```bash
npm install leaflet react-leaflet
npm install -D @types/leaflet
```

También habría que importar los estilos de Leaflet:

```txt
leaflet/dist/leaflet.css
```

En Next.js hay que tener en cuenta que Leaflet usa APIs del navegador, como `window`. Por eso el componente del mapa conviene cargarlo solo del lado del cliente usando `dynamic import` con `ssr: false`.

---

## Estructura sugerida del proyecto

Una estructura posible sería:

```txt
/app
  /sucursales
    page.tsx

/components
  /sucursales
    StoreLocator.tsx
    MapView.tsx
    BranchList.tsx
    BranchCard.tsx
    SelectedBranchCard.tsx
    SearchBox.tsx
    UseLocationButton.tsx

/data
  sucursales.ts

/types
  branch.ts

/utils
  distance.ts
  maps.ts
```

---

## Responsabilidad de cada parte

### `/app/sucursales/page.tsx`

Página principal donde se renderiza la sección de sucursales.

No debería tener demasiada lógica. Idealmente solo llama al componente principal:

```txt
StoreLocator
```

---

### `StoreLocator.tsx`

Sería el componente principal.

Maneja:

```txt
- Lista de sucursales
- Sucursal seleccionada
- Texto de búsqueda
- Ubicación del usuario
- Ordenamiento por cercanía
- Filtros
```

Es el “cerebro” de la sección.

---

### `MapView.tsx`

Se encarga del mapa.

Muestra:

```txt
- Mapa base
- Pins de sucursales
- Pin activo
- Popup o tarjeta flotante
```

También debería responder cuando el usuario hace click en un marcador.

---

### `BranchList.tsx`

Muestra la lista lateral de sucursales.

En desktop iría al costado del mapa.

En mobile podría ir debajo del mapa.

---

### `BranchCard.tsx`

Tarjeta individual de una sucursal.

Puede mostrar:

```txt
- Nombre
- Dirección
- Barrio
- Horario
- Estado: abierta/cerrada
- Botón Cómo llegar
- Botón WhatsApp
```

---

### `SelectedBranchCard.tsx`

Tarjeta flotante o destacada de la sucursal seleccionada.

Se puede mostrar sobre el mapa, parecida al estilo de Mapbox.

Ejemplo visual:

```txt
Sucursal Centro
Av. Colón 1234, Córdoba
Abierto hasta las 22:00

[Cómo llegar] [WhatsApp] [Llamar]
```

---

### `SearchBox.tsx`

Buscador de sucursales.

Para no usar APIs pagas, al principio el buscador debería buscar solo dentro de nuestros propios datos.

Podría buscar por:

```txt
- Nombre
- Dirección
- Barrio
- Zona
```

Ejemplo:

```txt
Buscar “Nueva Córdoba”
Buscar “Centro”
Buscar “Colón”
```

---

### `UseLocationButton.tsx`

Botón para usar la ubicación del usuario.

Ejemplo:

```txt
[Usar mi ubicación]
```

Al tocarlo, el navegador pide permiso para obtener la ubicación.

Con esa ubicación se puede:

```txt
- Calcular distancia a cada sucursal
- Ordenar por sucursal más cercana
- Marcar la más cercana
```

---

### `distance.ts`

Archivo de utilidad para calcular la distancia entre la ubicación del usuario y cada sucursal.

Se puede usar una fórmula matemática con latitud y longitud, sin pagar ninguna API externa.

---

### `maps.ts`

Archivo de utilidad para generar links externos.

Por ejemplo:

```txt
Link a Google Maps
Link a WhatsApp
Link de llamada telefónica
```

El botón “Cómo llegar” puede abrir Google Maps externo con las coordenadas de la sucursal.

Esto evita tener que pagar una API de rutas.

---

## Diseño visual recomendado

Aunque se use Leaflet y OpenStreetMap, el diseño puede verse parecido a Mapbox si se trabaja bien la interfaz.

La clave no es solo el mapa, sino todo lo que lo rodea.

### Elementos visuales importantes

```txt
- Fondo gris claro
- Contenedor grande con bordes redondeados
- Mapa con bordes redondeados
- Lista lateral blanca
- Tarjetas con sombra suave
- Pin personalizado
- Pin activo más destacado
- Botones claros y simples
- Tarjeta flotante sobre el mapa
```

---

## Layout recomendado en desktop

```txt
-----------------------------------------------------
| Encontrá tu sucursal más cercana                  |
| [Buscar por barrio, calle o zona...] [Ubicación] |
-----------------------------------------------------
|                                                   |
|  MAPA GRANDE                       LISTA          |
|  con pins                          Sucursal 1     |
|                                    Sucursal 2     |
|  Tarjeta flotante                  Sucursal 3     |
|                                                   |
-----------------------------------------------------
```

---

## Layout recomendado en mobile

```txt
Encontrá tu sucursal más cercana

[Buscar...]
[Usar mi ubicación]

MAPA

Sucursal seleccionada

Lista de sucursales
```

En mobile no conviene poner mapa y lista lado a lado porque queda muy apretado.

---

## Datos necesarios de cada sucursal

Cada sucursal debería tener como mínimo:

```txt
id
nombre
direccion
barrio
lat
lng
telefono
whatsapp
horarios
```

Y si se quiere mejorar más:

```txt
imagen
servicios
atiendeObraSocial
retiroEnLocal
delivery
abierta24hs
estado
```

---

## Ejemplo conceptual de una sucursal

```txt
Sucursal Centro
Dirección: Av. Colón 1234, Córdoba
Barrio: Centro
Teléfono: 351 1234567
WhatsApp: 351 1234567
Horario: Lunes a sábado de 8:00 a 22:00
Latitud: -31.4167
Longitud: -64.1833
Servicios: retiro en local, delivery, atención por WhatsApp
```

---

## Funciones de la primera versión

Para arrancar, la primera versión debería incluir:

```txt
- Mostrar el mapa
- Mostrar todas las sucursales como pins
- Mostrar listado lateral
- Seleccionar sucursal desde el mapa
- Seleccionar sucursal desde la lista
- Centrar mapa al seleccionar una sucursal
- Mostrar tarjeta destacada
- Botón Cómo llegar
- Botón WhatsApp
- Botón Llamar
```

Esta versión ya sería suficiente para una página profesional.

---

## Funciones de una segunda versión

Después se podrían agregar mejoras:

```txt
- Buscador por barrio, nombre o dirección
- Botón Usar mi ubicación
- Cálculo de distancia
- Ordenar sucursales por cercanía
- Mostrar “Sucursal más cercana”
- Filtro de sucursales abiertas
- Filtro por servicios disponibles
```

---

## Funciones de una tercera versión

Más adelante se podría sumar:

```txt
- Panel administrativo para cargar sucursales
- Horarios dinámicos
- Feriados
- Estado abierta/cerrada real
- Métricas de clicks en Cómo llegar
- Métricas de clicks en WhatsApp
- Integración con una base de datos
```

---

## Cómo mantenerlo gratis

Para evitar costos, conviene hacer esto:

```txt
- Usar Leaflet para el mapa
- Usar OpenStreetMap como mapa base
- Guardar las sucursales en datos propios
- Buscar solo dentro de nuestras sucursales
- Calcular distancia con una función propia
- Abrir Google Maps externo para las rutas
```

Y evitar al principio:

```txt
- Autocompletado real de direcciones
- Geocoding externo
- Directions API
- Rutas dibujadas dentro del mapa
- Cálculo de tiempo real de viaje
```

---

## Diferencia con Mapbox

### Mapbox

Ventajas:

```txt
- Estética muy moderna
- Mapas muy personalizables
- Buen autocompletado
- Buenas APIs de rutas y geocoding
```

Desventajas:

```txt
- Puede generar costos
- Requiere token
- Hay que controlar consumo
```

---

### Leaflet + OpenStreetMap

Ventajas:

```txt
- No requiere token para una versión simple
- Es open-source
- Es más económico para empezar
- Permite personalizar pins, popups y tarjetas
- Ideal para una página de sucursales
```

Desventajas:

```txt
- El mapa base puede verse menos premium por defecto
- El diseño visual depende más del CSS propio
- No trae autocompletado ni rutas avanzadas de fábrica
- Si el tráfico crece mucho, hay que revisar el uso de tiles
```

---

## Recomendación final

Para una primera versión profesional y sin pagar, lo mejor sería:

```txt
Next.js
+ TypeScript
+ Leaflet
+ React Leaflet
+ OpenStreetMap
+ CSS/Tailwind bien trabajado
```

El objetivo sería lograr una experiencia parecida a Mapbox desde lo visual, pero usando herramientas gratuitas.

La clave está en:

```txt
- Buen diseño de tarjetas
- Pins personalizados
- Interacción mapa/lista
- Botón Cómo llegar externo
- Ubicación del usuario opcional
- Diseño responsive
```

---

## Fuentes útiles

- Leaflet: https://leafletjs.com/
- React Leaflet: https://react-leaflet.js.org/
- OpenStreetMap Tile Usage Policy: https://operations.osmfoundation.org/policies/tiles/
- MDN Geolocation API: https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API
