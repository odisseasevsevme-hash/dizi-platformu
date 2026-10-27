"use client";

import { supabase } from "./supabase";

export async function uploadImage(file: File) {
  const path = `${crypto.randomUUID()}-${file.name}`;
  const { error } = await supabase.storage.from("posters").upload(path, file);
  if (error) throw error;
  return supabase.storage.from("posters").getPublicUrl(path).data.publicUrl;
}

export async function deleteImage(url: string | null) {
  const path = url?.split("/posters/")[1];
  if (path) await supabase.storage.from("posters").remove([decodeURIComponent(path)]);
}

export async function deleteVideos(videoIds: string[], accessToken: string) {
  if (videoIds.length === 0) return;
  const response = await fetch("/api/videos", {
    method: "DELETE",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ videoIds }),
  });
  if (!response.ok) throw new Error(`Videolar silinemedi: ${await response.text()}`);
}

export type SubtitleRequest = { sourceLanguage: string; targetLanguages: string[] };

// Bunny'nin yapay zekâsıyla altyazı oluşturur (ücretli). Dil seçilmemişse bir şey yapmaz.
export async function requestSubtitles(videoIds: string[], request: SubtitleRequest, accessToken: string) {
  if (videoIds.length === 0 || request.targetLanguages.length === 0) return;
  const response = await fetch("/api/transcribe", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ videoIds, ...request }),
  });
  if (!response.ok) throw new Error(`Altyazı isteği gönderilemedi: ${await response.text()}`);
}
