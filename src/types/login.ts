export type LoginResponse = {
  ok?: boolean;
  error?:
    | string
    | {
        code?: string;
        message?: string;
        correlationId?: string;
        details?: {
          remainingAttempts?: number;
          email?: string;
          retryAfterSec?: number;
        };
      };
  message?: string | string[];
  mfa?: {
    required?: boolean;
    loginTicket?: string;
    expiresAt?: number;
    channels?: string[];
  };
};

export type ForgotPasswordResponse = LoginResponse & {
  challenge?: {
    id?: string;
    expiresAt?: number;
  };
  correlationId?: string;
};


export interface LoginProps {
  onLogin?: (email: string, password: string) => void;
}

export type MfaState = NonNullable<LoginResponse["mfa"]> & {
  challengeChannel?: string;
};

export type LoginFormValues = {
  username: string;
  password: string;
};

export type RegisterFormValues = {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
};

export type ForgotPasswordFormValues = {
  identifier: string;
};

export type ResetPasswordFormValues = {
  code: string;
  newPassword: string;
};

export type PasswordRecoveryState = {
  challengeId: string;
  identifier: string;
  expiresAt?: number;
};

export type AuthCardView = "login" | "register" | "mfa" | "verify-email" | "forgot-password" | "reset-password";
