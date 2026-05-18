import type { RouteDefinition } from "../types/context";
import { health } from "../services/healthEndpointService";

export const healthRoutes: RouteDefinition[] = [
  { method: "GET", pattern: /^\/api\/health$/, handler: health },
];
