# README - Integración Backend para Login y Google Popup

## Resumen ejecutivo

Hoy el frontend puede iniciar login normal, MFA y Google popup, pero el flujo no queda autenticado en el dominio de la app porque hay dos problemas de backend:

1. El callback social está resolviendo en backend directo en lugar de volver al callback del frontend proxy.
2. La cookie de sesión se crea en dominio backend, pero no termina establecida en el dominio de la app cliente.

Además, en popup mode hay una restricción CSP que bloquea el script de postMessage y cierre de ventana.

---

## Estado observado

- En DevTools, la cookie sid aparece en api.dev.sanchezantoniolli.com.ar.
- En DevTools, no aparece sid en http://localhost:3000.
- El popup puede terminar en pantalla blanca o devolver JSON con:
  - AUTH_SOCIAL_CALLBACK_FAILED
- El frontend no recibe confirmación final para navegar a home.

---

## Objetivo funcional

El flujo correcto debe ser:

1. Usuario hace click en Continuar con Google desde frontend.
2. Backend inicia OAuth con Google.
3. Google vuelve al callback del frontend proxy.
4. El proxy valida/forwardea con backend.
5. El proxy devuelve respuesta popup con postMessage al opener.
6. El proxy establece sid en el dominio del frontend.
7. Frontend redirige a home y middleware detecta sid.

---

## Cambios requeridos en backend

## 1) Redirect URI de Google

Backend debe iniciar OAuth usando redirect_uri apuntando al frontend proxy, no al callback técnico backend.

En desarrollo local:
- http://localhost:3000/api/auth/providers/google/callback

En ambiente web:
- https://<dominio-frontend>/api/auth/providers/google/callback

Si Google vuelve directo a:
- https://api.dev.sanchezantoniolli.com.ar/api/v2/auth/providers/google/callback
el frontend no puede cerrar popup ni completar handshake como fue diseñado.

## 2) Callback social en modo popup

Cuando el flujo es popup, el callback debe devolver HTML y ejecutar:

- window.opener.postMessage(...)
- window.close()

No debe devolver JSON como respuesta final del popup.

Payload esperado:

- Éxito: { type: "SOCIAL_AUTH_SUCCESS" }
- Error: { type: "SOCIAL_AUTH_ERROR", error: "AUTH_GOOGLE_FAILED" }

Target origin debe ser estricto (dominio frontend exacto), nunca wildcard.

## 3) CSP compatible con popup script

Actualmente script inline está bloqueado por CSP script-src self.

Backend debe permitir ejecución del script del popup usando nonce (recomendado) o hash.

Ejemplo de header válido:
- Content-Security-Policy: default-src 'none'; script-src 'nonce-<nonce>'; base-uri 'none';

Y el script debe incluir el mismo nonce.

## 4) Cookie de sesión sid para frontend

Regla clave: la sesión debe terminar disponible en el dominio del frontend.

Lineamientos:

- Backend puede emitir su Set-Cookie interno, pero el flujo final debe permitir que el proxy frontend establezca sid en su dominio.
- Evitar forzar Domain del backend cuando la cookie deba vivir en frontend.
- Para local sin https:
  - SameSite none + Secure no es válido en muchos escenarios.
  - Preferir SameSite lax para localhost.
- Path debe ser /. 

Resultado esperado:

- En local: sid visible en Cookies de http://localhost:3000 (HttpOnly puede no verse por JS pero sí en Application tab).
- En web: sid en dominio frontend productivo/staging.

## 5) Manejo de errores consistente

Cuando falle OAuth en callback:

- Popup mode: devolver HTML que envíe SOCIAL_AUTH_ERROR y cierre popup.
- Redirect mode: redirigir al login del frontend con query de error controlada.

No exponer stack traces ni mensajes internos del proveedor.

---

## Contrato sugerido backend-frontend

## Endpoint start

- GET /providers/google/start
- Acepta mode=popup cuando aplique
- Redirige a Google con redirect_uri frontend proxy

## Endpoint callback

- GET /providers/google/callback
- Acepta parámetros de Google
- Si mode popup:
  - Responde HTML con script nonce
  - postMessage al opener
  - close
- Si mode redirect:
  - Redirige a ruta frontend segura
- Siempre que corresponda, devuelve Set-Cookie de sesión utilizable por el proxy

---

## Checklist de validación para backend

1. En Network, la URL callback final debe ser del frontend:
   - /api/auth/providers/google/callback
2. En popup mode, la respuesta final debe ser HTML, no JSON.
3. El script del popup debe ejecutar sin errores CSP.
4. El opener debe recibir postMessage con SOCIAL_AUTH_SUCCESS o SOCIAL_AUTH_ERROR.
5. Luego del éxito, debe existir sid en cookies del dominio frontend.
6. Acceder a /home no debe redirigir a login.

---

## Pruebas mínimas por ambiente

## Desarrollo local

- Frontend en http://localhost:3000
- Flujo Google popup completo sin pantalla blanca
- sid presente en localhost
- Middleware deja pasar a /home

## Staging/Producción

- Callback vuelve al dominio frontend correspondiente
- CSP válida para popup script
- sid en dominio frontend
- Redirección correcta y sesión persistente

---

## Notas de implementación

- El frontend ya maneja listener de message, validación de origin y navegación.
- El bloqueo principal actual es de contrato backend OAuth/callback/cookies.
- Si el backend devuelve AUTH_SOCIAL_CALLBACK_FAILED como JSON en popup, el flujo no puede completarse en UX.

---

## Resultado esperado tras corrección

- Login con Google abre popup, autentica, envía mensaje al opener y se cierra.
- El usuario queda autenticado en el frontend.
- Navega a home sin rebote al login.
- MFA/login tradicional y social quedan alineados en el mismo mecanismo de sesión.
