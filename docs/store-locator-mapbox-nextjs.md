# Store locator estilo Mapbox en Next.js

## Objetivo

La idea es crear una sección tipo **store locator** para mostrar todas las sucursales de una empresa, con un estilo moderno parecido al ejemplo visual que te gustó:

- Mapa grande.
- Pins de sucursales.
- Lista lateral de locales.
- Buscador de dirección, barrio o zona.
- Tarjeta destacada de la sucursal seleccionada.
- Botones rápidos como **Cómo llegar**, **Llamar** o **WhatsApp**.
- Opción de usar la ubicación del usuario para mostrar la sucursal más cercana.

---

## Resultado visual que buscaríamos

En escritorio:

```txt
---------------------------------------------------------
| Encontrá tu sucursal más cercana                      |
| [Buscar dirección, barrio o zona...] [Usar ubicación] |
---------------------------------------------------------
|                                |                      |
|           MAPA                 | Lista de sucursales  |
|                                |                      |
|     Pin seleccionado           | Sucursal Centro      |
|     + tarjeta flotante         | Sucursal Alta Cba    |
|                                | Sucursal Ruta 20     |
---------------------------------------------------------
```

En celular:

```txt
Encontrá tu sucursal más cercana

[Buscar dirección o barrio]
[Usar mi ubicación]

MAPA

Sucursal seleccionada

Lista de sucursales
```

---

## Tecnologías principales

### 1. Next.js

Sería la base de la web.

Lo usaríamos para:

- Crear la página de sucursales.
- Organizar los componentes.
- Manejar variables de entorno.
- Conectar con una API propia o base de datos.
- Separar componentes de servidor y cliente.

---

### 2. React + TypeScript

Lo usaríamos para armar los componentes interactivos:

- Mapa.
- Lista de sucursales.
- Tarjeta de sucursal.
- Buscador.
- Filtros.
- Estado de sucursal seleccionada.

TypeScript ayuda a que los datos de las sucursales estén bien definidos y evitar errores.

---

### 3. Mapbox GL JS

Es la librería principal para mostrar el mapa.

Permite:

- Mostrar mapas modernos.
- Usar estilos personalizados.
- Mostrar marcadores.
- Mover y centrar el mapa.
- Cambiar zoom.
- Personalizar colores, calles, nombres y apariencia general.

Mapbox es una buena opción si buscás algo más visual y premium que un mapa básico.

---

### 4. react-map-gl

Es una capa para usar Mapbox de forma más cómoda dentro de React.

Nos ayuda a trabajar con:

- Componente `<Map />`.
- Marcadores.
- Popups.
- Controles.
- Eventos de click.
- Estado del viewport del mapa.

---

### 5. Mapbox Search / Geocoding

Esto sería para el buscador.

Hay dos formas de usarlo:

#### Opción simple

Buscar solo entre las sucursales cargadas.

Ejemplo:

```txt
El usuario escribe "Nueva Córdoba"
El sistema filtra las sucursales que tengan ese barrio o dirección
```

Esta opción no requiere consultar direcciones externas.

#### Opción más completa

Usar búsqueda real de direcciones con Mapbox.

Ejemplo:

```txt
El usuario escribe "Av. Colón 1500, Córdoba"
Mapbox devuelve latitud y longitud
El sistema calcula qué sucursal queda más cerca
```

Para esta opción usaríamos servicios como:

- Mapbox Search Box.
- Mapbox Geocoding API.

---

### 6. CSS / SCSS / Tailwind

Para el diseño visual.

Se puede usar cualquiera de estas opciones:

- SCSS modules.
- Tailwind.
- CSS tradicional.
- shadcn/ui para tarjetas, botones e inputs.

Como venís usando shadcn y Tailwind en otros proyectos, una buena combinación sería:

```txt
Next.js + TypeScript + Mapbox + react-map-gl + Tailwind + shadcn/ui
```

---

## Paquetes a instalar

Para el mapa principal:

```bash
npm install react-map-gl mapbox-gl
npm install -D @types/mapbox-gl
```

Opcionalmente, para iconos:

```bash
npm install lucide-react
```

Opcionalmente, para buscador avanzado de direcciones con Mapbox:

```bash
npm install @mapbox/search-js-react
```

Opcionalmente, para componentes de UI:

```bash
npx shadcn@latest add button input card badge
```

---

## Variable de entorno necesaria

Mapbox necesita un token público.

En `.env.local`:

```env
NEXT_PUBLIC_MAPBOX_TOKEN=tu_token_publico_de_mapbox
```

Importante:

- Al ser `NEXT_PUBLIC_`, el token queda disponible en el frontend.
- No deberías usar tokens secretos en el frontend.
- Conviene configurar restricciones desde la cuenta de Mapbox, por ejemplo por dominio.

---

## Datos que deberíamos tener de cada sucursal

Cada sucursal debería tener una estructura clara.

Ejemplo conceptual:

```ts
type Sucursal = {
  id: string;
  nombre: string;
  direccion: string;
  barrio?: string;
  ciudad: string;
  provincia: string;
  telefono?: string;
  whatsapp?: string;
  horarios?: string;
  lat: number;
  lng: number;
  imagen?: string;
  servicios?: string[];
  activa: boolean;
};
```

Ejemplo de datos:

```ts
const sucursales = [
  {
    id: "centro",
    nombre: "Sucursal Centro",
    direccion: "Av. Colón 1234",
    barrio: "Centro",
    ciudad: "Córdoba",
    provincia: "Córdoba",
    telefono: "351 1234567",
    whatsapp: "5493511234567",
    horarios: "Lunes a sábado de 8:00 a 22:00",
    lat: -31.4167,
    lng: -64.1833,
    imagen: "/sucursales/centro.jpg",
    servicios: ["Retiro en local", "WhatsApp", "Obras sociales"],
    activa: true
  }
];
```

Lo más importante para el mapa es tener:

```txt
latitud
longitud
nombre
dirección
```

Sin latitud y longitud, no podemos ubicar correctamente los pins.

---

## Componentes que armaríamos

Una estructura posible:

```txt
/app/sucursales/page.tsx

/components/sucursales/StoreLocator.tsx
/components/sucursales/MapboxMap.tsx
/components/sucursales/BranchList.tsx
/components/sucursales/BranchCard.tsx
/components/sucursales/SelectedBranchCard.tsx
/components/sucursales/BranchSearch.tsx
/components/sucursales/UseLocationButton.tsx

/data/sucursales.ts
/types/sucursal.ts
/utils/distance.ts
```

---

## Responsabilidad de cada componente

### StoreLocator

Componente principal.

Maneja:

- Lista de sucursales.
- Sucursal seleccionada.
- Búsqueda.
- Filtros.
- Ubicación del usuario.
- Orden por distancia.

Sería como el “cerebro” de la sección.

---

### MapboxMap

Muestra el mapa.

Se encarga de:

- Renderizar Mapbox.
- Mostrar los pins.
- Detectar click en un marcador.
- Centrar el mapa cuando cambia la sucursal seleccionada.
- Mostrar una tarjeta flotante o popup.

---

### BranchList

Muestra la lista lateral.

Se encarga de:

- Renderizar todas las sucursales visibles.
- Resaltar la sucursal seleccionada.
- Permitir click sobre una sucursal.
- Mostrar distancia, dirección y acciones rápidas.

---

### BranchCard

Tarjeta individual de una sucursal.

Debería mostrar:

- Nombre.
- Dirección.
- Barrio.
- Distancia si está disponible.
- Estado: abierta/cerrada.
- Botones rápidos.

---

### SelectedBranchCard

Tarjeta flotante sobre el mapa.

Debería aparecer cuando el usuario selecciona un pin o una sucursal de la lista.

Ejemplo:

```txt
Farmacia Sánchez Antoniolli - Centro

Av. Colón 1234, Córdoba
Abierto hasta las 22:00
A 2.4 km de tu ubicación

[Cómo llegar] [WhatsApp] [Llamar]
```

---

### BranchSearch

Buscador superior.

Podría tener dos versiones:

#### Versión simple

Filtra las sucursales por:

- Nombre.
- Dirección.
- Barrio.
- Ciudad.

#### Versión avanzada

Busca direcciones reales usando Mapbox Search.

---

### UseLocationButton

Botón para pedir ubicación al usuario.

Flujo:

```txt
Usuario toca "Usar mi ubicación"
El navegador pide permiso
Obtenemos latitud y longitud
Calculamos distancia a cada sucursal
Ordenamos de menor a mayor distancia
Destacamos la más cercana
```

---

## Funciones principales que necesitamos

### 1. Seleccionar sucursal

Cuando el usuario toca una tarjeta o un pin:

```txt
- Guardamos la sucursal seleccionada.
- Centramos el mapa en esa sucursal.
- Cambiamos el pin activo.
- Mostramos la tarjeta flotante.
- Resaltamos la tarjeta en la lista.
```

---

### 2. Botón “Cómo llegar”

Este botón puede abrir Google Maps o Mapbox Directions.

La opción más simple es abrir Google Maps con coordenadas:

```txt
https://www.google.com/maps/dir/?api=1&destination=LAT,LNG
```

Aunque usemos Mapbox para mostrar el mapa, podemos usar Google Maps para las indicaciones porque el usuario ya lo tiene incorporado.

---

### 3. Calcular distancia

Cuando tengamos la ubicación del usuario:

```txt
distancia entre usuario y sucursal
```

Esto se puede calcular con la fórmula de Haversine.

Resultado visual:

```txt
Sucursal Centro
A 1.8 km de tu ubicación
```

---

### 4. Ordenar por cercanía

Una vez calculadas las distancias:

```txt
Sucursal más cercana primero
Luego la segunda
Luego la tercera
```

---

### 5. Filtrar sucursales

Filtros posibles:

```txt
- Abierta ahora
- Con WhatsApp
- Con retiro en local
- Con envío
- Con atención de obra social
- Por barrio
```

---

## Diseño visual recomendado

Para que quede parecido al ejemplo:

### Layout general

- Contenedor blanco grande.
- Bordes redondeados.
- Fondo general suave.
- Mapa a la izquierda.
- Lista a la derecha.
- Buscador arriba.

---

### Mapa

- Estilo claro.
- Calles en gris suave.
- Pins con color de marca.
- Pin activo más grande o con otro color.
- Tarjeta flotante con imagen.

---

### Lista lateral

Cada sucursal puede verse así:

```txt
Sucursal Centro
Av. Colón 1234, Córdoba

A 2.4 km        [Cómo llegar]
[WhatsApp]     [Llamar]
```

Visualmente:

- Tarjetas blancas.
- Sombra suave.
- Bordes redondeados.
- Espaciado cómodo.
- Iconos pequeños.

---

### Colores posibles

Si lo vinculamos con la marca de farmacia/CORA:

```txt
Principal: morado o teal
Secundario: amarillo
Fondo: gris muy claro
Tarjetas: blanco
Texto principal: negro suave
Texto secundario: gris
Pin activo: color principal fuerte
```

Ejemplo:

```txt
Botón principal: #045C6C
Pin normal: #0B87A0
Pin activo: #F2C23D
Fondo: #F5F7F8
```

---

## Cómo lo desarrollaría por etapas

### Etapa 1: versión base

Objetivo: que ya se vea lindo y funcione.

Incluye:

- Mapa con Mapbox.
- Pins de sucursales.
- Lista lateral.
- Tarjeta seleccionada.
- Click en pin.
- Click en tarjeta.
- Botón “Cómo llegar”.

Esta etapa ya alcanza para tener algo usable y parecido al ejemplo.

---

### Etapa 2: buscador simple

Objetivo: filtrar sucursales.

Incluye:

- Input de búsqueda.
- Buscar por nombre, dirección o barrio.
- Actualizar lista.
- Mantener mapa sincronizado.

---

### Etapa 3: ubicación del usuario

Objetivo: mostrar la sucursal más cercana.

Incluye:

- Botón “Usar mi ubicación”.
- Permiso del navegador.
- Calcular distancias.
- Ordenar por cercanía.
- Destacar la sucursal más cercana.

---

### Etapa 4: búsqueda avanzada con Mapbox

Objetivo: buscar cualquier dirección real.

Incluye:

- Autocomplete de direcciones.
- Conversión de dirección a coordenadas.
- Centrar mapa en la dirección buscada.
- Calcular sucursal más cercana desde ese punto.

---

### Etapa 5: mejoras visuales

Objetivo: dejarlo más premium.

Incluye:

- Pins personalizados con logo.
- Animación al seleccionar sucursal.
- Tarjetas con imágenes.
- Badges de servicios.
- Estado “abierto ahora”.
- Skeleton/loading.
- Empty state cuando no hay resultados.

---

## Consideraciones importantes en Next.js

Mapbox usa APIs del navegador, como `window`.

Por eso, en Next.js conviene que el componente del mapa sea **client-side**.

Conceptualmente:

```txt
page.tsx
  carga StoreLocator

StoreLocator
  usa dynamic import para cargar MapboxMap con SSR desactivado
```

El mapa debería vivir en un componente con:

```txt
"use client"
```

Y si hace falta, cargarlo con:

```txt
dynamic import + ssr: false
```

Esto evita errores típicos cuando Next intenta renderizar el mapa en el servidor.

---

## Datos desde archivo o base de datos

### Primera versión

Podemos cargar las sucursales desde un archivo:

```txt
/data/sucursales.ts
```

Ventaja:

- Rápido.
- Simple.
- Ideal si hay pocas sucursales.
- No requiere backend.

---

### Versión más completa

Cargar sucursales desde la base de datos.

Ventaja:

- Se pueden editar desde un panel.
- Se pueden activar/desactivar sucursales.
- Se pueden cambiar horarios.
- Se pueden agregar servicios.
- Se puede mantener todo sin tocar código.

---

## Panel administrativo opcional

A futuro, podrías tener un panel para cargar sucursales.

Campos:

```txt
Nombre
Dirección
Barrio
Ciudad
Provincia
Teléfono
WhatsApp
Horarios
Latitud
Longitud
Imagen
Servicios
Estado activo/inactivo
```

Esto permitiría que alguien de administración actualice la información sin depender del desarrollador.

---

## Cosas que deberíamos definir antes de programar

Antes de empezar, conviene definir:

```txt
1. Lista real de sucursales.
2. Latitud y longitud de cada sucursal.
3. Colores de marca.
4. Si tendrá imagen cada sucursal.
5. Si se usará WhatsApp.
6. Si se quiere usar ubicación del usuario desde la primera versión.
7. Si la búsqueda será simple o con Mapbox Search.
8. Si las sucursales vienen de archivo o base de datos.
```

---

## Recomendación para arrancar

Yo lo haría así:

```txt
Primera versión:
Next.js + TypeScript + Mapbox + react-map-gl + Tailwind/shadcn

Datos:
Archivo local con sucursales

Funciones:
Mapa
Pins
Lista lateral
Sucursal seleccionada
Botón Cómo llegar

Segunda versión:
Ubicación del usuario
Distancia
Orden por cercanía

Tercera versión:
Buscador avanzado con Mapbox Search
Panel para administrar sucursales
```

---

## Resumen corto

Para lograr un store locator estilo Mapbox en Next.js necesitaríamos:

```txt
Tecnologías:
- Next.js
- React
- TypeScript
- Mapbox GL JS
- react-map-gl
- Tailwind o SCSS
- shadcn/ui opcional
- lucide-react opcional
- Mapbox Search opcional

Datos:
- Nombre
- Dirección
- Latitud
- Longitud
- Teléfono
- WhatsApp
- Horarios
- Imagen
- Servicios

Funciones:
- Mostrar mapa
- Mostrar pins
- Seleccionar sucursal
- Lista lateral
- Buscador
- Cómo llegar
- Usar ubicación
- Ordenar por cercanía
```

---

## Referencias útiles

- Mapbox GL JS: https://docs.mapbox.com/mapbox-gl-js/
- react-map-gl: https://visgl.github.io/react-map-gl/
- Mapbox Search JS: https://docs.mapbox.com/mapbox-search-js/
- Next.js dynamic import: https://nextjs.org/docs/pages/guides/lazy-loading
