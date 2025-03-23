export interface AuthErrorResponse {
  error?: {
    message?: string;
    code?: string;
    status?: number;
  };
  status?: number;
  statusText?: string;
  message?: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    name?: string;
    role?: string;
  };
  expiresIn?: number;
}
