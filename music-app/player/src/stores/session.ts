const TOKEN_KEY = "spotijay_token";
const ADMIN_KEY = "spotijay_is_admin";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function saveSession(token: string, isAdmin: boolean): void {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(ADMIN_KEY, isAdmin ? "true" : "false");
}

export function clearSession(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(ADMIN_KEY);
}

export function isAdmin(): boolean {
  return localStorage.getItem(ADMIN_KEY) === "true";
}
