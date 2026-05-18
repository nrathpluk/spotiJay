export interface ApiErrorBody {
  code: string;
  message: string;
}

export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface ApiFailure {
  success: false;
  error: ApiErrorBody;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

export interface AuthResult {
  token: string;
  username: string;
  isAdmin: boolean;
}

export interface SessionUser {
  username: string;
  isAdmin: boolean;
}

export interface Song {
  name: string;
  url: string;
}

export interface HealthStatus {
  status: "ok";
  bindings: {
    r2: boolean;
    kv: boolean;
  };
}
