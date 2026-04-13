# Configuración requerida en Keycloak para Google OAuth con proxy frontend

## Contexto

El flujo de login social con Google pasa ahora por el proxy del frontend antes de llegar al BFF:

```
Usuario → Frontend (popup) → /api/auth/providers/google/start
       → BFF inicia OAuth con Keycloak
       → Keycloak redirige a Google
       → Google vuelve a Keycloak con code
       → Keycloak redirige al redirect_uri registrado
       → Frontend proxy recibe el callback en /api/auth/providers/google/callback
       → Proxy reenvía al BFF
       → BFF emite sesión (Set-Cookie: sid)
       → Popup cierra y envía postMessage al opener
       → Usuario queda autenticado
```

El BFF calcula el `redirect_uri` dinámicamente usando el header `x-forwarded-host` que envía el proxy.
Keycloak valida que ese `redirect_uri` esté en su lista de URIs permitidas antes de proceder.
Si no está registrada, Keycloak rechaza con `invalid redirect_uri`.

---

## Qué hay que hacer en Keycloak

En el panel de **Keycloak Admin Console**, dentro del realm `FSA`, abrir el cliente `bff` y agregar las siguientes URLs en **Valid Redirect URIs**:

### Desarrollo local

```
http://localhost:3000/api/auth/providers/google/callback
```

### Ambiente dev/staging

```
https://sociosa.dev.sanchezantoniolli.com.ar/api/v2/auth/providers/google/callback
```

### Producción (cuando corresponda)

```
https://<dominio-frontend-produccion>/api/auth/providers/google/callback
```

---

## Qué tiene que hacer el BFF

El BFF debe usar el header `x-forwarded-host` para construir el `redirect_uri` cuando inicia el flujo OAuth.

Variable de entorno esperada en el BFF (o calculada desde el header):

```env
KC_REDIRECT_URI=https://<FRONT_DOMAIN>/api/auth/providers/google/callback
```

El proxy frontend envía siempre estos headers al BFF:

```
x-forwarded-host: localhost:3000          (o el dominio del frontend)
x-forwarded-proto: http                   (o https en producción)
x-forwarded-for: <IP del cliente>
```

---

## Checklist de validación

- [ ] URL de callback del frontend agregada en Valid Redirect URIs del cliente `bff` en Keycloak
- [ ] BFF usa `x-forwarded-host` para construir `redirect_uri`
- [ ] El `redirect_uri` en el `Location` de inicio de OAuth apunta al frontend y no al BFF
- [ ] El callback del BFF responde con `Set-Cookie: sid=...` en el `200`
- [ ] El popup recibe `postMessage` con `{ type: "SOCIAL_AUTH_SUCCESS" }` y se cierra
- [ ] En DevTools > Application > Cookies > localhost:3000 aparece `sid`
- [ ] Acceder a `/home` no redirige al login

---

## Síntoma si falta esta configuración

El popup abre la pantalla de Google, pero al volver Keycloak muestra error similar a:

```
Invalid parameter: redirect_uri
```

O el BFF responde `{ "error": "AUTH_SOCIAL_CALLBACK_FAILED" }` sin emitir cookie de sesión.
