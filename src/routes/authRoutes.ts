import type { RouteDefinition } from "../types/context";
import { login, me, register } from "../services/authEndpointService";

export const authRoutes: RouteDefinition[] = [
  { method: "POST", pattern: /^\/register$/, handler: register },
  { method: "POST", pattern: /^\/api\/auth\/register$/, handler: register },
  { method: "POST", pattern: /^\/login$/, handler: login },
  { method: "POST", pattern: /^\/api\/auth\/login$/, handler: login },
  { method: "GET", pattern: /^\/me$/, handler: me },
  { method: "GET", pattern: /^\/api\/auth\/me$/, handler: me },
];
