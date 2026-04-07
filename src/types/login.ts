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

export type AuthCardView = "login" | "register" | "mfa";
