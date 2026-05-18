import type { AuthResult, SessionUser } from "../types/api";
import { apiCall, authHeaders } from "./client";

export interface Credentials {
  username: string;
  password: string;
}

export function login(credentials: Credentials): Promise<AuthResult> {
  return apiCall<AuthResult>("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  });
}

export function register(credentials: Credentials): Promise<AuthResult> {
  return apiCall<AuthResult>("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  });
}

export function getCurrentUser(token: string): Promise<SessionUser> {
  return apiCall<SessionUser>("/api/auth/me", {
    headers: authHeaders(token),
  });
}
