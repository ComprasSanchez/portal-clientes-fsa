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
          flowId?: string;
        };
      };
  message?: string | string[];
  nextStep?: string;
  flow?: {
    id?: string;
    status?: string;
    expiresAt?: number;
    emailVerified?: boolean;
    identityLinked?: boolean;
    deviceTrusted?: boolean;
  };
  challenge?: {
    channel?: string;
    destinationMasked?: string;
  };
  onboarding?: {
    status?: string;
    identityLinked?: boolean;
    deviceTrusted?: boolean;
  };
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
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  documentType: string;
  documentNumber: string;
  sex: string;
  birthDate: string;
  phone: string;
};

export type CustomerIdentityFormValues = {
  firstName: string;
  lastName: string;
  documentType: string;
  documentNumber: string;
  sex: string;
  birthDate: string;
  phone: string;
};

export type GoogleOnboardingFormValues = CustomerIdentityFormValues;

export type OnboardingFlowState = {
  id: string;
  status?: string;
  expiresAt?: number;
  destinationMasked?: string;
  channel?: string;
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

export type AuthCardView =
  | "login"
  | "register"
  | "mfa"
  | "verify-onboarding"
  | "forgot-password"
  | "reset-password"
  | "google-onboarding";
