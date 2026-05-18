export function getApiBaseUrl(): string {
  const value = import.meta.env.VITE_API_URL;
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error("Missing VITE_API_URL");
  }
  return value.replace(/\/+$/, "");
}
