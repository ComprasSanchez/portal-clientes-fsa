# Implementacion de logout en un BFF

Este documento resume como implementar el logout siguiendo el enfoque usado en este proyecto.

## Objetivo

El logout no se resuelve borrando tokens en frontend. Se resuelve invalidando la sesion del lado del servidor y eliminando la cookie de sesion en la respuesta HTTP.

En este BFF, el logout actual es local:

- Lee el `sid` desde una cookie `HttpOnly`.
- Borra la sesion server-side en Redis.
- Limpia la cookie en el navegador.
- Devuelve `204 No Content`.

No hace un logout federado contra Keycloak u otro Identity Provider. Si otro proyecto necesita single logout real, eso es un requerimiento adicional.

## Flujo esperado

1. Exponer un endpoint `POST /auth/logout`.
2. Leer el `sid` desde la cookie de sesion.
3. Si existe `sid`, invalidar la sesion en el store server-side.
4. Limpiar la cookie usando exactamente los mismos atributos con los que fue creada.
5. Responder `204 No Content`.
6. Mantener el endpoint idempotente: si no hay cookie o la sesion ya no existe, igual responder exito.

## Ejemplo de implementacion

```ts
@Post('logout')
@HttpCode(204)
async logout(@Req() req: Request, @Res() res: Response) {
  const sid = req.cookies?.[cookieName] as string | undefined;

  if (sid) {
    await sessionManager.destroyBySid(sid);
  }

  res.clearCookie(cookieName, {
    httpOnly: true,
    secure,
    sameSite,
    domain,
    path: '/',
  });

  return res.send();
}
```

Si la implementacion usa Redis directamente, la destruccion de sesion suele verse asi:

```ts
await redis.del(`sid:${sid}`);
```

## Contrato de sesion recomendado

- La cookie contiene solo el identificador de sesion, por ejemplo `sid`.
- La sesion real vive en el backend.
- El backend debe poder destruir la sesion por `sid`.

Ejemplo de interfaz util:

```ts
abstract class SessionManagerPort {
  abstract destroyBySid(sid: string): Promise<void>;
}
```

## Detalle importante sobre cookies

La cookie debe limpiarse con los mismos atributos usados al setearla. Si no coincide alguno, el navegador puede conservarla.

Prestar atencion a:

- `name`
- `domain`
- `path`
- `sameSite`
- `secure`

Esto es especialmente importante si el sistema corre detras de un proxy o usa subdominios.

## Comportamiento recomendado

### Idempotencia

El logout deberia devolver exito aunque:

- no venga la cookie
- la sesion ya haya sido borrada
- el usuario repita la accion varias veces

Eso simplifica frontend, reintentos y flujos distribuidos.

### Manejo de errores

Si el store de sesiones esta caido, conviene mapearlo a un error explicito de infraestructura, por ejemplo `503 Service Unavailable`.

## Que hace este proyecto

En este proyecto el logout implementado hace esto:

- toma el `sid` desde la cookie
- borra la key `sid:${sid}` del store de sesiones
- limpia la cookie de sesion
- responde sin body

Conceptualmente:

```ts
const sid = req.cookies?.[cookieName];

if (sid) {
  await store.del(`sid:${sid}`);
}

res.clearCookie(cookieName, cookieOptions);
return res.send();
```

## Aclaracion sobre logout federado

Este flujo cierra la sesion local del BFF. No cierra necesariamente la sesion del Identity Provider.

Si el otro proyecto necesita logout federado, ademas de destruir la sesion local va a tener que:

1. invocar el end-session endpoint del proveedor OIDC
2. manejar `post_logout_redirect_uri` si aplica
3. decidir si tambien invalida refresh tokens del lado del proveedor

Eso ya no es solo logout local, sino single logout o logout federado.