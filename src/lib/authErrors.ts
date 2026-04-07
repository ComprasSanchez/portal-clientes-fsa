// Centraliza el mapeo de errores de autenticación/MFA

export type AuthErrorCode =
  | 'AUTH_INVALID_CREDENTIALS'
  | 'AUTH_MFA_CHALLENGE_FAILED'
  | 'AUTH_MFA_CODE_INVALID'
  | 'AUTH_MFA_INVALID_CODE'
  | 'AUTH_USER_ALREADY_EXISTS'
  | 'AUTH_USERNAME_ALREADY_EXISTS'
  | 'AUTH_EMAIL_ALREADY_EXISTS'
  | 'AUTH_REGISTER_FAILED'
  | 'AUTH_SESSION_EXPIRED'
  | 'AUTH_UNKNOWN'
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
      return 'Ese email ya está registrado.';
    case 'AUTH_REGISTER_FAILED':
      return 'No pudimos crear la cuenta. Intentá nuevamente.';
    case 'AUTH_SESSION_EXPIRED':
      return 'La sesión ha expirado. Por favor, inicia sesión nuevamente.';
    default:
      return 'Ocurrió un error inesperado. Intenta nuevamente.';
  }
}
