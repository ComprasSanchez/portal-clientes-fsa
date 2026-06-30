// Centraliza el mapeo de errores de autenticacion/MFA

export type AuthErrorCode =
  | "AUTH_INVALID_CREDENTIALS"
  | "AUTH_MFA_CHALLENGE_FAILED"
  | "AUTH_MFA_CODE_INVALID"
  | "AUTH_MFA_INVALID_CODE"
  | "AUTH_USER_ALREADY_EXISTS"
  | "AUTH_USERNAME_ALREADY_EXISTS"
  | "AUTH_EMAIL_ALREADY_EXISTS"
  | "AUTH_REGISTER_EMAIL_IN_USE"
  | "AUTH_REGISTER_EMAIL_SEND_FAILED"
  | "AUTH_REGISTER_FAILED"
  | "AUTH_RESET_CHALLENGE_INVALID"
  | "AUTH_RESET_CHALLENGE_EXPIRED"
  | "AUTH_RESET_INVALID_CODE"
  | "AUTH_RESET_LOCKED"
  | "AUTH_RESET_PASSWORD_FAILED"
  | "AUTH_EMAIL_VERIFY_TOKEN_INVALID"
  | "AUTH_EMAIL_VERIFY_TOKEN_EXPIRED"
  | "AUTH_EMAIL_VERIFY_RESEND_COOLDOWN"
  | "AUTH_SESSION_EXPIRED"
  | "AUTH_UNKNOWN"
  | "AUTH_EMAIL_NOT_VERIFIED"
  | "AUTH_EMAIL_VERIFY_RESEND_LIMIT"
  | "AUTH_ONBOARDING_INVALID"
  | "AUTH_ONBOARDING_EXPIRED"
  | "AUTH_ONBOARDING_TOKEN_INVALID"
  | "AUTH_ONBOARDING_TOKEN_EXPIRED"
  | "AUTH_ONBOARDING_ALREADY_COMPLETED"
  | "AUTH_ONBOARDING_IDENTITY_LINK_CONFLICT"
  | "AUTH_ONBOARDING_COMPLETE_FAILED"
  | "AUTH_ONBOARDING_RESEND_COOLDOWN"
  | "AUTH_ONBOARDING_RESEND_LIMIT"
  | "AUTH_IDENTITY_LINK_INVALID"
  | "AUTH_IDENTITY_LINK_EXPIRED"
  | "AUTH_IDENTITY_LINK_CONFLICT"
  | "AUTH_IDENTITY_LINK_START_FAILED"
  | "AUTH_IDENTITY_LINK_CHALLENGE_REQUIRED"
  | "AUTH_IDENTITY_LINK_CHANNEL_UNAVAILABLE"
  | "AUTH_IDENTITY_LINK_CHALLENGE_FAILED"
  | "AUTH_IDENTITY_LINK_OTP_INVALID"
  | "AUTH_IDENTITY_LINK_OTP_LOCKED"
  | "AUTH_IDENTITY_LINK_OTP_EXPIRED"
  | "AUTH_IDENTITY_LINK_MIRROR_FAILED"
  | "AUTH_IDENTITY_LINK_VERIFY_FAILED"
  | "AUTH_MFA_TICKET_INVALID"
  | "AUTH_MFA_COOLDOWN"
  | "AUTH_SOCIAL_CALLBACK_FAILED"
  | "AUTH_SOCIAL_EMAIL_CONFLICT"
  | string;

const DEFAULT_AUTH_ERROR_MESSAGE =
  "Ocurrio un error inesperado. Intenta nuevamente.";

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  AUTH_INVALID_CREDENTIALS: "Usuario o contrasena incorrectos.",
  AUTH_MFA_CHALLENGE_FAILED:
    "Error inesperado al iniciar el OTP. Intenta nuevamente.",
  AUTH_MFA_CODE_INVALID: "El codigo OTP ingresado no es valido.",
  AUTH_MFA_INVALID_CODE: "El codigo OTP ingresado no es valido.",
  AUTH_USER_ALREADY_EXISTS: "Ese usuario ya existe. Proba con otro.",
  AUTH_USERNAME_ALREADY_EXISTS: "Ese usuario ya existe. Proba con otro.",
  AUTH_EMAIL_ALREADY_EXISTS: "Ese email ya esta registrado.",
  AUTH_MFA_TICKET_INVALID:
    "El código venció o no es válido. Tocá 'Reenviar código' para recibir uno nuevo.",
  AUTH_REGISTER_EMAIL_IN_USE: "Ese email ya esta registrado.",
  AUTH_MFA_COOLDOWN: "El reenvio del OTP esta en tiempo de espera.",
  AUTH_REGISTER_EMAIL_SEND_FAILED:
    "No pudimos enviar el email de confirmacion.",
  AUTH_REGISTER_FAILED: "No pudimos crear la cuenta. Intenta nuevamente.",
  AUTH_RESET_CHALLENGE_INVALID:
    "La solicitud para restablecer la contrasena no es valida.",
  AUTH_RESET_CHALLENGE_EXPIRED:
    "La solicitud para restablecer la contrasena expiro. Solicita un nuevo codigo.",
  AUTH_RESET_INVALID_CODE: "El codigo de recuperacion ingresado no es valido.",
  AUTH_RESET_LOCKED:
    "La recuperacion de contrasena fue bloqueada temporalmente por demasiados intentos.",
  AUTH_RESET_PASSWORD_FAILED:
    "No pudimos actualizar tu contrasena. Intenta nuevamente.",
  AUTH_EMAIL_VERIFY_TOKEN_INVALID: "El enlace de verificacion no es valido.",
  AUTH_EMAIL_VERIFY_TOKEN_EXPIRED:
    "El enlace de verificacion expiro. Solicita uno nuevo.",
  AUTH_EMAIL_VERIFY_RESEND_COOLDOWN:
    "Ya enviamos un email de verificacion recientemente. Por favor, revisa tu bandeja de entrada o intenta nuevamente mas tarde.",
  AUTH_EMAIL_NOT_VERIFIED:
    "Tu email no ha sido verificado. Por favor, revisa tu bandeja de entrada.",
  AUTH_EMAIL_VERIFY_RESEND_LIMIT:
    "Has alcanzado el limite de reenvios de email de verificacion. Por favor, intenta nuevamente mas tarde.",
  AUTH_ONBOARDING_INVALID: "El registro solicitado no es válido.",
  AUTH_ONBOARDING_EXPIRED: "El registro expiró. Volvé a iniciar el proceso.",
  AUTH_ONBOARDING_TOKEN_INVALID: "El token de registro no es válido.",
  AUTH_ONBOARDING_TOKEN_EXPIRED:
    "El token de registro expiró. Solicitá un nuevo email.",
  AUTH_ONBOARDING_ALREADY_COMPLETED:
    "Este registro ya fue completado. Podés iniciar sesión.",
  AUTH_ONBOARDING_IDENTITY_LINK_CONFLICT:
    "Los datos de identidad ya están vinculados a otra cuenta.",
  AUTH_ONBOARDING_COMPLETE_FAILED:
    "No pudimos completar el registro. Intentá nuevamente.",
  AUTH_ONBOARDING_RESEND_COOLDOWN:
    "Ya enviamos el email recientemente. Esperá unos segundos antes de volver a intentarlo.",
  AUTH_ONBOARDING_RESEND_LIMIT:
    "Alcanzaste el límite de reenvíos. Revisá tu bandeja de entrada o spam.",
  AUTH_IDENTITY_LINK_INVALID:
    "La solicitud de vinculacion no es valida o expiro.",
  AUTH_IDENTITY_LINK_EXPIRED:
    "La solicitud de vinculacion expiro. Inicia el proceso nuevamente.",
  AUTH_IDENTITY_LINK_CONFLICT:
    "No pudimos vincular tu cuenta porque el documento o el email ya estan asociados a otra cuenta.",
  AUTH_IDENTITY_LINK_START_FAILED:
    "No pudimos iniciar la vinculacion de tu cuenta. Intenta nuevamente.",
  AUTH_IDENTITY_LINK_CHALLENGE_REQUIRED:
    "Ya enviamos un codigo para esta vinculacion. Revisa tu email.",
  AUTH_IDENTITY_LINK_CHANNEL_UNAVAILABLE:
    "No podemos enviar el codigo por ese canal en este momento.",
  AUTH_IDENTITY_LINK_CHALLENGE_FAILED:
    "No pudimos enviar el codigo de vinculacion. Intenta nuevamente.",
  AUTH_IDENTITY_LINK_OTP_INVALID:
    "El codigo de vinculacion ingresado no es valido.",
  AUTH_IDENTITY_LINK_OTP_LOCKED:
    "La vinculacion fue bloqueada temporalmente por demasiados intentos.",
  AUTH_IDENTITY_LINK_OTP_EXPIRED:
    "El codigo de vinculacion expiro. Solicita uno nuevo.",
  AUTH_IDENTITY_LINK_MIRROR_FAILED:
    "La cuenta se vinculo, pero no pudimos sincronizar todos los datos. Contacta a soporte.",
  AUTH_IDENTITY_LINK_VERIFY_FAILED:
    "No pudimos completar la vinculacion. Intenta nuevamente.",
  AUTH_SESSION_EXPIRED:
    "La sesion ha expirado. Por favor, inicia sesion nuevamente.",
  AUTH_SOCIAL_CALLBACK_FAILED:
    "No pudimos completar el inicio de sesión con Google. Intentá nuevamente.",
  AUTH_SOCIAL_EMAIL_CONFLICT:
    "Este Gmail ya tiene una cuenta creada con usuario y contraseña. Iniciá sesión con tus credenciales.",
};

export function mapAuthError(code: AuthErrorCode, fallback?: string): string {
  return AUTH_ERROR_MESSAGES[code] ?? fallback ?? DEFAULT_AUTH_ERROR_MESSAGE;
}
