import type { Song } from "../types/api";
import { apiCall, authHeaders } from "./client";

export function listSongs(): Promise<Song[]> {
  return apiCall<Song[]>("/api/songs");
}

export function uploadSong(file: File, token: string | null): Promise<{ name: string }> {
  const formData = new FormData();
  formData.append("file", file);
  return apiCall<{ name: string }>("/api/songs/upload", {
    method: "POST",
    headers: authHeaders(token),
    body: formData,
  });
}

export function deleteSong(name: string, token: string | null): Promise<{ name: string }> {
  return apiCall<{ name: string }>("/api/songs", {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(token),
    },
    body: JSON.stringify({ name }),
  });
}
