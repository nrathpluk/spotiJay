import type { RequestContext } from "../types/context";
import { jsonResponse } from "../utils/http";
import { HealthService } from "./healthService";

export async function health(context: RequestContext): Promise<Response> {
  const service = new HealthService(context.env);
  return jsonResponse(await service.check());
}
