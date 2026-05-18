import { requireUser } from "../middleware/auth";
import type { RequestContext } from "../types/context";
import { jsonResponse, readJsonBody } from "../utils/http";
import { validateCredentials } from "../utils/validation";
import { AuthService } from "./authService";

export async function register(context: RequestContext): Promise<Response> {
  const body = await readJsonBody<Record<string, unknown>>(context.request);
  const credentials = validateCredentials(body);
  const service = new AuthService(context.env);
  return jsonResponse(await service.register(credentials));
}

export async function login(context: RequestContext): Promise<Response> {
  const body = await readJsonBody<Record<string, unknown>>(context.request);
  const credentials = validateCredentials(body);
  const service = new AuthService(context.env);
  return jsonResponse(await service.login(credentials));
}

export async function me(context: RequestContext): Promise<Response> {
  return jsonResponse(await requireUser(context));
}
