# Ajuste requerido en backend para Google Login con Popup

## Problema actual

En el flujo de login social con Google usando popup, el callback del backend está devolviendo una página HTML con un script inline para ejecutar:

- `window.opener.postMessage(...)`
- `window.close()`

Pero ese script está siendo bloqueado por la política CSP actual:

```text
Content Security Policy directive: script-src 'self'
```

Eso impide que la popup:

1. Envíe el mensaje al frontend principal.
2. Se cierre automáticamente.
3. Complete correctamente el flujo de autenticación popup.

---

## Qué debe hacer el backend

Para el modo popup, el callback técnico del backend debe:

1. Devolver `HTML`, no `JSON`.
2. Ejecutar `window.opener.postMessage(...)`.
3. Ejecutar `window.close()`.
4. Permitir ese script mediante `nonce` o `hash` en CSP.
5. Mantener la creación de sesión y cookie `sid` HttpOnly como hasta ahora.

---

## Recomendación

Usar `nonce` en la respuesta del callback popup.

Es la opción más robusta porque el contenido del script puede variar según:

- `SOCIAL_AUTH_SUCCESS`
- `SOCIAL_AUTH_ERROR`
- `targetOrigin`
- códigos de error

---

## Ejemplo esperado para éxito

### Response headers

```http
Content-Type: text/html; charset=utf-8
Cache-Control: no-store
Content-Security-Policy: default-src 'none'; script-src 'nonce-{{nonce}}'; base-uri 'none';
```

### Response body

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Social login</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
  </head>
  <body>
    <script nonce="{{nonce}}">
      window.opener.postMessage(
        { type: "SOCIAL_AUTH_SUCCESS" },
        "https://frontend.example.com"
      );
      window.close();
    </script>
  </body>
</html>
```

---

## Ejemplo esperado para error

### Response headers

```http
Content-Type: text/html; charset=utf-8
Cache-Control: no-store
Content-Security-Policy: default-src 'none'; script-src 'nonce-{{nonce}}'; base-uri 'none';
```

### Response body

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Social login error</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
  </head>
  <body>
    <script nonce="{{nonce}}">
      window.opener.postMessage(
        { type: "SOCIAL_AUTH_ERROR", error: "AUTH_GOOGLE_FAILED" },
        "https://frontend.example.com"
      );
      window.close();
    </script>
  </body>
</html>
```

---

## Qué no debería hacer el backend en popup mode

No debería:

1. Devolver JSON.
2. Redirigir al frontend final.
3. Responder con HTML que use script inline sin `nonce` o `hash`.
4. Usar `targetOrigin: *` en `postMessage`.

---

## Qué ya está resuelto del lado frontend

El frontend ya está preparado para:

1. Abrir la popup con `window.open(...)`.
2. Escuchar el evento `message`.
3. Validar `event.origin`.
4. Navegar cuando recibe:
   - `SOCIAL_AUTH_SUCCESS`
   - `SOCIAL_AUTH_ERROR`

---

## Conclusión

El problema actual no está en la apertura de la popup ni en el listener del frontend.

El ajuste pendiente está en el callback del backend para popup mode:

1. Responder HTML.
2. Ejecutar `postMessage` y `window.close()`.
3. Permitir ese script con CSP compatible usando `nonce` o `hash`.