import type { RouteDefinition } from "../types/context";
import {
  deleteSong,
  importPlaylist,
  listSongs,
  stream,
  streamPattern,
  upload,
} from "../services/musicEndpointService";

export const musicRoutes: RouteDefinition[] = [
  { method: "GET", pattern: /^\/$/, handler: listSongs },
  { method: "GET", pattern: /^\/api\/songs$/, handler: listSongs },
  { method: "POST", pattern: /^\/upload$/, handler: upload },
  { method: "POST", pattern: /^\/api\/songs\/upload$/, handler: upload },
  { method: "DELETE", pattern: /^\/delete$/, handler: deleteSong },
  { method: "DELETE", pattern: /^\/api\/songs$/, handler: deleteSong },
  { method: "GET", pattern: streamPattern, handler: stream },
  { method: "POST", pattern: /^\/import$/, handler: importPlaylist },
  { method: "POST", pattern: /^\/api\/playlist\/import$/, handler: importPlaylist },
];
