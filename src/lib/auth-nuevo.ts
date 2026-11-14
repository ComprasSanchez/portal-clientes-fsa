// Login y registro nuevos del portal (mismos pasos que la app SocioSA). Lógica
// pura y llamadas a /api/v2/web/* (proxy al gateway), sin UI.

import { getSafeRedirectPath } from "@/lib/auth";

/** Se prende con NEXT_PUBLIC_LOGIN_NUEVO=true; apagado, el portal usa el login de siempre. */
export const isLoginNuevoActivo = () => process.env.NEXT_PUBLIC_LOGIN_NUEVO === "true";

// ---------------------------------------------------------------------------
// Datos que pasan de una pantalla a la otra (email, "recordar", código pedido).
// En sessionStorage: se borran al cerrar la pestaña.

export type AuthOrigen = { canal?: string; sucursal_codigo?: string; convenio?: string };

export type AuthFlow = {
  email?: string;
  recordar?: boolean;
  /** Código de ingreso pedido (después de la contraseña o "código por email"). */
  challenge?: { id: string; destination: string; tipo: "mfa" | "email" };
  /** Cuándo se pidió el último código por email (ms), para la espera entre pedidos. */
  codigoPedidoAt?: number;
  registro?: { flowId: string; destination: string };
  /** "Olvidé mi contraseña": código pedido al email. */
  recuperacion?: { challengeId: string; pedidoAt: number };
  /** Se acaba de cambiar la contraseña: el paso de contraseña lo avisa. */
  claveCambiada?: boolean;
  redirectTo?: string;
  origen?: AuthOrigen;
};

const FLOW_KEY = "fsa_auth_nuevo";

// Copia en memoria (además de sessionStorage) para que `leerFlowSnapshot` devuelva
// siempre el mismo objeto mientras no cambie: lo exige useSyncExternalStore.
let cacheRaw: string | null | undefined;
let cacheFlow: AuthFlow = {};
const listeners = new Set<() => void>();

export function leerFlowSnapshot(): AuthFlow {
  let raw: string | null = null;
  try {
    raw = window.sessionStorage.getItem(FLOW_KEY);
  } catch {
    // Sin almacenamiento: queda lo que haya en memoria.
    return cacheFlow;
  }
  if (raw !== cacheRaw) {
    cacheRaw = raw;
    try {
      cacheFlow = raw ? (JSON.parse(raw) as AuthFlow) : {};
    } catch {
      cacheFlow = {};
    }
  }
  return cacheFlow;
}

export const leerFlow = (): AuthFlow => leerFlowSnapshot();

export function suscribirFlow(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function escribirFlow(next: AuthFlow | null, avisar = true): void {
  try {
    if (next) window.sessionStorage.setItem(FLOW_KEY, JSON.stringify(next));
    else window.sessionStorage.removeItem(FLOW_KEY);
  } catch {
    // Sin almacenamiento: se mantiene en memoria mientras dure la pestaña.
    cacheRaw = undefined;
    cacheFlow = next ?? {};
  }
  if (avisar) listeners.forEach((l) => l());
}

export function guardarFlow(patch: Partial<AuthFlow>): AuthFlow {
  const next = { ...leerFlow(), ...patch };
  escribirFlow(next);
  return next;
}

/**
 * Borra los datos del flujo. Al salir del ingreso no avisa a la pantalla actual:
 * si lo hiciera, la pantalla volvería al primer paso mientras el navegador navega.
 */
export function limpiarFlow({ alSalir = false }: { alSalir?: boolean } = {}): void {
  escribirFlow(null, !alSalir);
}

/** Toma `redirectTo` y el origen del alta (QR de sucursal / convenio) de la URL de entrada. */
export function capturarParametrosDeEntrada(params: URLSearchParams): void {
  const redirectTo = params.get("redirectTo");
  const origen: AuthOrigen = {
    canal: params.get("canal")?.trim() || undefined,
    sucursal_codigo:
      params.get("sucursalCodigo")?.trim() || params.get("sucursal")?.trim() || undefined,
    convenio: params.get("convenio")?.trim() || undefined,
  };
  const tieneOrigen = Object.values(origen).some(Boolean);
  if (!redirectTo && !tieneOrigen) return;
  guardarFlow({
    ...(redirectTo ? { redirectTo } : {}),
    ...(tieneOrigen ? { origen: { ...origen, canal: origen.canal ?? (origen.convenio ? "CONVENIO" : undefined) } } : {}),
  });
}

export const destinoDespuesDelIngreso = (): string =>
  getSafeRedirectPath(leerFlow().redirectTo ?? null);

export const emailValido = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

// ---------------------------------------------------------------------------
// Llamadas

export class AuthNuevoError extends Error {
  constructor(
    message: string,
    readonly code?: string,
    /** Segundos que faltan para poder pedir otro código (si el error es por esperar). */
    readonly retryAfterSec?: number,
  ) {
    super(message);
  }
}

/** El gateway deja pedir otro código por email cada 60 segundos. */
export const ESPERA_ENTRE_CODIGOS_SEG = 60;

/** Segundos que faltan para poder pedir otro código, según cuándo se pidió el último. */
export function segundosParaOtroCodigo(pedidoAt: number | undefined, ahora: number): number {
  if (!pedidoAt) return 0;
  return Math.max(0, Math.ceil((pedidoAt + ESPERA_ENTRE_CODIGOS_SEG * 1000 - ahora) / 1000));
}

/** "0:42" */
export const formatoEspera = (seg: number) =>
  `${Math.floor(seg / 60)}:${String(seg % 60).padStart(2, "0")}`;

type ApiErrorBody = {
  error?: { code?: string; details?: Record<string, unknown> } | string;
  message?: string;
};

const call = <T>(method: "GET" | "POST", path: string, body?: unknown) =>
  request<T>(method, `/api/v2/web/${path}`, body);

async function request<T>(method: "GET" | "POST", url: string, body?: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, {
      method,
      cache: "no-store",
      credentials: "include",
      headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new AuthNuevoError("No pudimos conectarnos. Revisá tu conexión a internet.");
  }
  const data: unknown = await res.json().catch(() => null);
  if (res.ok) return data as T;
  throw toAuthError(res.status, (data ?? {}) as ApiErrorBody);
}

export type LookupStatus = "ACCOUNT" | "ACCOUNT_UNVERIFIED" | "CLIENTE_WITHOUT_ACCOUNT" | "NOT_FOUND";

export const buscarEmail = (email: string) =>
  call<{ status: LookupStatus }>("POST", "auth/login/lookup", { email: email.trim() });

type Challenge = { challenge_id: string; destination_masked: string };

export const ingresarConContrasena = (email: string, password: string, recordar: boolean) =>
  call<{ mfa_required: boolean; challenge?: Challenge }>("POST", "auth/login", {
    email: email.trim(),
    password,
    recordar,
  });

export const confirmarCodigoDeIngreso = (
  challengeId: string,
  code: string,
  recordar: boolean,
  rememberDevice: boolean,
) =>
  call<{ ok: true }>("POST", "auth/mfa/verify", {
    challenge_id: challengeId,
    code,
    recordar,
    remember_device: rememberDevice,
  });

export const reenviarCodigoDeIngreso = (challengeId: string) =>
  call<{ challenge: Challenge }>("POST", "auth/mfa/resend", { challenge_id: challengeId });

export const pedirCodigoPorEmail = (email: string) =>
  call<{ challenge: Challenge }>("POST", "auth/login/email-code", { email: email.trim() });

export const confirmarCodigoPorEmail = (challengeId: string, code: string, recordar: boolean) =>
  call<{ ok: true }>("POST", "auth/login/email-code/verify", {
    challenge_id: challengeId,
    code,
    recordar,
  });

export type RegistroDatos = {
  email: string;
  password: string;
  nombre: string;
  apellido: string;
  nro_documento: string;
};

export type ErroresRegistro = Partial<Record<keyof RegistroDatos | "politica", string>>;

export const dniValido = (dni: string) => /^\d{7,8}$/.test(dni);

export function validarRegistro(d: RegistroDatos, politica: boolean): ErroresRegistro {
  const e: ErroresRegistro = {};
  if (!d.nombre.trim()) e.nombre = "Ingresá tu nombre.";
  if (!d.apellido.trim()) e.apellido = "Ingresá tu apellido.";
  if (!dniValido(d.nro_documento)) e.nro_documento = "Ingresá tu DNI sin puntos (7 u 8 números).";
  if (!emailValido(d.email)) e.email = "Ingresá un email válido.";
  if (d.password.length < 8) e.password = "La contraseña tiene que tener al menos 8 caracteres.";
  if (!politica) e.politica = "Tenés que aceptar la política de privacidad.";
  return e;
}

export const registrarse = (datos: RegistroDatos, origen?: AuthOrigen) =>
  call<{ flow_id: string; challenge: { destination_masked: string } }>("POST", "auth/register", {
    ...datos,
    email: datos.email.trim(),
    acepta_politica_privacidad: true,
    ...(origen ?? {}),
  });

export const confirmarRegistro = (flowId: string, code: string, recordar: boolean) =>
  call<{ identity_linked: boolean; session_started: boolean }>("POST", "auth/register/verify", {
    flow_id: flowId,
    code,
    recordar,
  });

export const reenviarCodigoDeRegistro = (flowId: string) =>
  call<{ flow_id: string; challenge: { destination_masked: string } }>(
    "POST",
    "auth/register/resend",
    { flow_id: flowId },
  );

// ---- Olvidé mi contraseña (mismo servicio que el ingreso de siempre) ----

/** Responde igual exista o no la cuenta: no revela qué emails están registrados. */
export const pedirCodigoDeRecuperacion = (email: string) =>
  request<{ challenge?: { id?: string; expiresAt?: number } }>("POST", "/api/auth/forgot-password", {
    identifier: email.trim().toLowerCase(),
  });

export const cambiarContrasenaConCodigo = (challengeId: string, code: string, nueva: string) =>
  request<{ ok?: boolean }>("POST", "/api/auth/reset-password", {
    challengeId,
    code,
    newPassword: nueva,
  });

export function validarContrasenaNueva(nueva: string, repetida: string): string | null {
  if (nueva.length < 8) return "La contraseña tiene que tener al menos 8 caracteres.";
  if (nueva !== repetida) return "Las contraseñas no coinciden.";
  return null;
}

// ---- Validar identidad (cuenta sin vincular al cliente) ----

export type IdentidadStatus = "LINKED" | "PENDING" | "ONBOARDING_REQUIRED" | "UNAVAILABLE";
export type IdentidadCanal = { channel: "whatsapp" | "email"; destination_masked: string };

type ValidacionEnCurso = { channel: "whatsapp" | "email"; destination_masked: string };

export const consultarIdentidad = () =>
  call<{
    status: IdentidadStatus;
    channels?: IdentidadCanal[];
    /** UNAVAILABLE con ficha sin contactos: puede validar con un contacto propio. */
    self_contact?: { email_masked: string | null };
    validation?: ValidacionEnCurso;
  }>("GET", "me/identidad");

/** Ficha sin contactos: código al email de la cuenta o WhatsApp a un celular propio. */
export const iniciarValidacionConContactoPropio = (
  datos: { channel: "email" } | { channel: "whatsapp"; telefono: string },
) => call<{ validation: ValidacionEnCurso }>("POST", "me/identidad/contacto", datos);

export const iniciarValidacion = (channel: "whatsapp" | "email") =>
  call<{ validation: { channel: string; destination_masked: string } }>(
    "POST",
    "me/identidad/validacion",
    { channel },
  );

export const consultarValidacion = () =>
  call<{ status: "LINKED" | "WAITING" | "EXPIRED" }>("GET", "me/identidad/validacion");

export const confirmarCodigoDeIdentidad = (code: string) =>
  call<{ status: "LINKED" }>("POST", "me/identidad/validacion/codigo", { code });

export const completarAlta = (datos: { nombre: string; apellido: string; nro_documento: string }) =>
  call<{ identity_linked: boolean }>("POST", "me/alta", {
    ...datos,
    acepta_politica_privacidad: true,
  });

// ---- Colaboradores habilitados: contraseña nueva para un socio ----

export type CuentaSocio = { nombre: string | null; email_masked: string | null };

export const consultarPermisoClaves = () =>
  call<{ habilitado: boolean }>("GET", "me/soporte/clave");

export const buscarCuentaSocio = (nroDocumento: string) =>
  call<{ cuenta: CuentaSocio }>("POST", "me/soporte/clave/cuenta", { nro_documento: nroDocumento });

export const generarClaveSocio = (nroDocumento: string) =>
  call<{ cuenta: CuentaSocio; password: string }>("POST", "me/soporte/clave", {
    nro_documento: nroDocumento,
  });

/**
 * Después de iniciar sesión, al destino (ej. el stand escaneado). Si la cuenta
 * no está vinculada, el portal entra en modo limitado y ahí ofrece validar la
 * identidad. Navegación completa para que el portal lea la cookie nueva.
 */
export function irDespuesDelIngreso(): Promise<void> {
  const destino = destinoDespuesDelIngreso();
  limpiarFlow({ alSalir: true });
  window.location.assign(destino);
  return Promise.resolve();
}

// ---------------------------------------------------------------------------
// Errores → textos para el cliente (mismos que la app)

const codigoIncorrecto = (attempts?: number) => {
  if (attempts === undefined || attempts > 2) return "El código no es correcto. Revisalo y probá de nuevo.";
  if (attempts === 0) return "El código no es correcto.";
  return `El código no es correcto. Te ${attempts === 1 ? "queda 1 intento" : `quedan ${attempts} intentos`}.`;
};

const esperar = (seconds?: number) =>
  seconds ? `Esperá ${seconds} segundos antes de pedir otro código.` : "Esperá un momento antes de pedir otro código.";

const FALLBACK = "No pudimos completar la acción. Probá de nuevo en unos minutos.";

function toAuthError(status: number, body: ApiErrorBody): AuthNuevoError {
  const err = typeof body.error === "object" ? body.error : undefined;
  const code = err?.code;
  const details = err?.details ?? {};
  // El servicio de contraseña de siempre manda los detalles en camelCase.
  const retry = details.retry_after_sec ?? details.retryAfterSec;
  const restantes = details.remaining_attempts ?? details.remainingAttempts;
  const seconds = typeof retry === "number" ? retry : undefined;
  const attempts = typeof restantes === "number" ? restantes : undefined;
  const maskedEmail = typeof details.masked_email === "string" ? details.masked_email : undefined;

  const rawMessage = typeof body.message === "string" ? body.message : "";
  if (status === 429 || rawMessage.toLowerCase().includes("rate limit")) {
    return new AuthNuevoError("Hiciste muchos intentos seguidos. Esperá un minuto y probá de nuevo.", "RATE_LIMITED");
  }

  const mensajes: Record<string, string> = {
    AUTH_INVALID_CREDENTIALS: "El email o la contraseña no son correctos.",
    AUTH_EMAIL_NOT_VERIFIED:
      "Todavía no confirmaste tu email. Completá de nuevo el registro con este email y te enviamos un código para confirmarlo.",
    AUTH_ACCOUNT_DISABLED: "Tu cuenta está deshabilitada. Acercate a una sucursal para resolverlo.",
    AUTH_MFA_INVALID_CODE: codigoIncorrecto(attempts),
    AUTH_MFA_EXPIRED: "El código venció. Pedí uno nuevo.",
    AUTH_MFA_LOCKED: "Hiciste demasiados intentos. Esperá unos minutos y volvé a iniciar sesión.",
    AUTH_MFA_COOLDOWN: esperar(seconds),
    AUTH_MFA_RESEND_LIMIT: "Ya pediste varios códigos. Volvé a iniciar sesión para recibir uno nuevo.",
    AUTH_MFA_TICKET_INVALID: "Pasó demasiado tiempo. Volvé a iniciar sesión.",
    AUTH_MFA_TICKET_EXPIRED: "Pasó demasiado tiempo. Volvé a iniciar sesión.",
    AUTH_SESSION_EXPIRED: "Pasó demasiado tiempo. Volvé a iniciar sesión.",
    AUTH_EMAIL_LOGIN_UNAVAILABLE: "Por ahora no podemos enviarte un código. Ingresá con tu contraseña.",
    AUTH_EMAIL_LOGIN_COOLDOWN: esperar(seconds),
    AUTH_EMAIL_LOGIN_SEND_FAILED: "No pudimos enviarte el código. Probá de nuevo en unos minutos.",
    AUTH_EMAIL_LOGIN_CODE_INVALID: codigoIncorrecto(attempts),
    AUTH_EMAIL_LOGIN_CODE_EXPIRED: "El código venció. Pedí uno nuevo.",
    AUTH_EMAIL_LOGIN_LOCKED: "Hiciste demasiados intentos. Esperá unos minutos y probá de nuevo.",
    AUTH_EMAIL_LOGIN_CHALLENGE_INVALID: "El código ya no es válido. Pedí uno nuevo.",
    AUTH_REGISTER_EMAIL_IN_USE: "Ya existe una cuenta con ese email. Iniciá sesión con tu email.",
    AUTH_REGISTER_DOCUMENTO_ALREADY_LINKED: maskedEmail
      ? `Ese DNI ya está asociado a la cuenta ${maskedEmail}. Cerrá sesión y entrá con esa cuenta.`
      : "Ya existe una cuenta con ese DNI. Iniciá sesión con tu email.",
    AUTH_REGISTER_EMAIL_SEND_FAILED: "No pudimos enviarte el código. Revisá el email y probá de nuevo.",
    AUTH_REGISTER_CODE_INVALID: codigoIncorrecto(attempts),
    AUTH_REGISTER_CODE_EXPIRED: "El código venció. Pedí uno nuevo.",
    AUTH_REGISTER_CODE_LOCKED: "Hiciste demasiados intentos. Esperá unos minutos y probá de nuevo.",
    AUTH_REGISTER_RESEND_COOLDOWN: esperar(seconds),
    AUTH_REGISTER_RESEND_LIMIT: "Ya pediste varios códigos. Volvé a empezar el registro.",
    AUTH_REGISTER_FLOW_INVALID: "Pasó demasiado tiempo. Volvé a empezar el registro.",
    AUTH_IDENTITY_CODE_INVALID: codigoIncorrecto(attempts),
    AUTH_IDENTITY_CODE_EXPIRED: "El código venció. Pedí uno nuevo.",
    AUTH_IDENTITY_CODE_LOCKED: "Hiciste demasiados intentos. Esperá unos minutos y probá de nuevo.",
    AUTH_IDENTITY_RESEND_COOLDOWN: esperar(seconds),
    AUTH_IDENTITY_RESEND_LIMIT: "Ya pediste varios códigos. Probá de nuevo más tarde.",
    AUTH_IDENTITY_SEND_FAILED: "No pudimos enviarte el mensaje. Probá de nuevo en unos minutos.",
    AUTH_IDENTITY_LINK_CONFLICT:
      "Estos datos ya están asociados a otra cuenta. Acercate a una sucursal con tu DNI para resolverlo.",
    AUTH_IDENTITY_ALREADY_LINKED: "Tu identidad ya está validada.",
    AUTH_IDENTITY_PHONE_INVALID:
      "Revisá el número: ingresá la característica y el número, sin el 0 ni el 15.",
    AUTH_IDENTITY_CHANNEL_NOT_AVAILABLE: "Esta opción ya no está disponible. Volvé a cargar la página.",
    AUTH_PASSWORD_RECOVERY_SEND_FAILED: "No pudimos enviarte el código. Probá de nuevo en unos minutos.",
    AUTH_RESET_INVALID_CODE: codigoIncorrecto(attempts),
    AUTH_RESET_CHALLENGE_EXPIRED: "El código venció. Pedí uno nuevo.",
    AUTH_RESET_CHALLENGE_INVALID: "El código ya no es válido. Pedí uno nuevo.",
    AUTH_RESET_LOCKED: "Hiciste demasiados intentos. Esperá unos minutos y pedí un código nuevo.",
    AUTH_RESET_PASSWORD_FAILED:
      "No pudimos guardar la contraseña nueva. Probá con otra o intentá de nuevo en unos minutos.",
    AUTH_SOPORTE_FORBIDDEN: "No tenés permiso para cambiar contraseñas de socios.",
    AUTH_SOPORTE_CLIENTE_NOT_FOUND: "No encontramos ningún socio con ese DNI.",
    AUTH_SOPORTE_CUENTA_NOT_FOUND: "Ese socio todavía no tiene cuenta en el portal. Puede crearla desde el registro.",
    AUTH_SOPORTE_CUENTA_PROPIA: "Es tu propia cuenta. Cambiá tu contraseña desde el ingreso, con \"¿Olvidaste tu contraseña?\".",
    AUTH_SOPORTE_CUENTA_COLABORADOR: "Es la cuenta de un colaborador. Desde acá solo se pueden cambiar contraseñas de socios.",
    AUTH_SOPORTE_CLAVE_FAILED: "No pudimos cambiar la contraseña. Probá de nuevo en unos minutos.",
  };

  if (status === 401 && !code) {
    return new AuthNuevoError("Pasó demasiado tiempo. Volvé a iniciar sesión.", "SESSION_EXPIRED");
  }
  return new AuthNuevoError((code && mensajes[code]) || FALLBACK, code, seconds);
}

export const mensajeDeError = (error: unknown) =>
  error instanceof AuthNuevoError ? error.message : FALLBACK;
