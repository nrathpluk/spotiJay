import type { ApiFailure, ApiResponse } from "../types/api";
import { getApiBaseUrl } from "./config";

export class ApiClientError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(code: string, message: string, status: number) {
    super(message);
    this.name = "ApiClientError";
    this.code = code;
    this.status = status;
  }
}

function isApiFailure(value: ApiResponse<unknown>): value is ApiFailure {
  return value.success === false;
}

export async function apiCall<T>(path: string, init: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${getApiBaseUrl()}${path}`, init);
  } catch {
    throw new ApiClientError("NETWORK_ERROR", "Network error. Please try again.", 0);
  }

  let payload: ApiResponse<T>;
  try {
    payload = await response.json() as ApiResponse<T>;
  } catch {
    throw new ApiClientError("INVALID_RESPONSE", "Invalid server response", response.status);
  }

  if (!response.ok || isApiFailure(payload)) {
    const error = isApiFailure(payload)
      ? payload.error
      : { code: "HTTP_ERROR", message: "Request failed" };
    throw new ApiClientError(error.code, error.message, response.status);
  }

  return payload.data;
}

export function authHeaders(token: string | null): HeadersInit {
  return token ? { Authorization: `Bearer ${token}` } : {};
}
