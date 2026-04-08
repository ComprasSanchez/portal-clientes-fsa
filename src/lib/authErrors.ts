// Centraliza el mapeo de errores de autenticación/MFA

export type AuthErrorCode =
  | 'AUTH_INVALID_CREDENTIALS'
  | 'AUTH_MFA_CHALLENGE_FAILED'
  | 'AUTH_MFA_CODE_INVALID'
  | 'AUTH_MFA_INVALID_CODE'
  | 'AUTH_USER_ALREADY_EXISTS'
  | 'AUTH_USERNAME_ALREADY_EXISTS'
  | 'AUTH_EMAIL_ALREADY_EXISTS'
  | 'AUTH_REGISTER_EMAIL_IN_USE'
  | 'AUTH_REGISTER_EMAIL_SEND_FAILED'
  | 'AUTH_REGISTER_FAILED'
  | 'AUTH_RESET_CHALLENGE_INVALID'
  | 'AUTH_RESET_CHALLENGE_EXPIRED'
  | 'AUTH_RESET_INVALID_CODE'
  | 'AUTH_RESET_LOCKED'
  | 'AUTH_RESET_PASSWORD_FAILED'
  | 'AUTH_EMAIL_VERIFY_TOKEN_INVALID'
  | 'AUTH_EMAIL_VERIFY_TOKEN_EXPIRED'
  | 'AUTH_EMAIL_VERIFY_RESEND_COOLDOWN'
  | 'AUTH_SESSION_EXPIRED'
  | 'AUTH_UNKNOWN'
  | 'AUTH_EMAIL_NOT_VERIFIED'
  | 'AUTH_EMAIL_VERIFY_RESEND_LIMIT'
  | string;

export function mapAuthError(code: AuthErrorCode): string {
  switch (code) {
    case 'AUTH_INVALID_CREDENTIALS':
      return 'Usuario o contraseña incorrectos.';
    case 'AUTH_MFA_CHALLENGE_FAILED':
      return 'Error inesperado al iniciar el OTP. Intenta nuevamente.';
    case 'AUTH_MFA_CODE_INVALID':
    case 'AUTH_MFA_INVALID_CODE':
      return 'El código MFA ingresado no es válido.';
    case 'AUTH_USER_ALREADY_EXISTS':
    case 'AUTH_USERNAME_ALREADY_EXISTS':
      return 'Ese usuario ya existe. Probá con otro.';
    case 'AUTH_EMAIL_ALREADY_EXISTS':
    case 'AUTH_REGISTER_EMAIL_IN_USE':
      return 'Ese email ya está registrado.';
    case 'AUTH_REGISTER_EMAIL_SEND_FAILED':
      return 'No pudimos enviar el email de confirmación.';
    case 'AUTH_REGISTER_FAILED':
      return 'No pudimos crear la cuenta. Intentá nuevamente.';
    case 'AUTH_RESET_CHALLENGE_INVALID':
      return 'La solicitud para restablecer la contraseña no es válida.';
    case 'AUTH_RESET_CHALLENGE_EXPIRED':
      return 'La solicitud para restablecer la contraseña expiró. Solicitá un nuevo código.';
    case 'AUTH_RESET_INVALID_CODE':
      return 'El código de recuperación ingresado no es válido.';
    case 'AUTH_RESET_LOCKED':
      return 'La recuperación de contraseña fue bloqueada temporalmente por demasiados intentos.';
    case 'AUTH_RESET_PASSWORD_FAILED':
      return 'No pudimos actualizar tu contraseña. Intentá nuevamente.';
    case 'AUTH_EMAIL_VERIFY_TOKEN_INVALID':
      return 'El enlace de verificación no es válido.';
    case 'AUTH_EMAIL_VERIFY_TOKEN_EXPIRED':
      return 'El enlace de verificación expiró. Solicitá uno nuevo.';
    case 'AUTH_EMAIL_VERIFY_RESEND_COOLDOWN':
      return 'Ya enviamos un email de verificación recientemente. Por favor, revisá tu bandeja de entrada o intentá nuevamente más tarde.';
    case 'AUTH_EMAIL_NOT_VERIFIED':
      return 'Tu email no ha sido verificado. Por favor, revisá tu bandeja de entrada.';
    case 'AUTH_EMAIL_VERIFY_RESEND_LIMIT':
      return 'Has alcanzado el límite de reenvíos de email de verificación. Por favor, intentá nuevamente más tarde.';
    case 'AUTH_SESSION_EXPIRED':
      return 'La sesión ha expirado. Por favor, inicia sesión nuevamente.';
    default:
      return 'Ocurrió un error inesperado. Intenta nuevamente.';
  }
}
