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
// force: video daha önce (ör. Bunny'nin otomatik İngilizce altyazısıyla) işlendiyse yeniden işlet
export async function requestSubtitles(
  videoIds: string[],
  request: SubtitleRequest,
  accessToken: string,
  { force = false }: { force?: boolean } = {},
) {
  if (videoIds.length === 0 || request.targetLanguages.length === 0) return "";
  const response = await fetch("/api/transcribe", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ videoIds, ...request, force }),
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`Altyazı isteği gönderilemedi: ${text}`);
  return text;
}

// Bir videonun Bunny'de hazır olan altyazı dilleri
export async function fetchCaptions(videoId: string): Promise<{ srclang: string; label: string }[]> {
  const response = await fetch(`/api/captions/${encodeURIComponent(videoId)}`, { cache: "no-store" });
  return response.ok ? response.json() : [];
}

// SRT dosyasını tarayıcıların anladığı WebVTT biçimine çevirir (zaten VTT ise dokunmaz)
export function toVtt(text: string) {
  const clean = text.replace(/^﻿/, "").replace(/\r\n?/g, "\n").trim();
  if (clean.startsWith("WEBVTT")) return clean + "\n";
  return `WEBVTT\n\n${clean.replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, "$1.$2")}\n`;
}

export async function loadCaptionText(videoId: string, lang: string) {
  const response = await fetch(`/api/captions/${encodeURIComponent(videoId)}/${encodeURIComponent(lang)}`, {
    cache: "no-store",
  });
  if (!response.ok) throw new Error("Altyazı dosyası alınamadı");
  return response.text();
}

export async function saveCaption(videoId: string, lang: string, label: string, text: string, accessToken: string) {
  const response = await fetch(`/api/captions/${encodeURIComponent(videoId)}/${encodeURIComponent(lang)}`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ label, text: toVtt(text) }),
  });
  if (!response.ok) throw new Error(`Altyazı kaydedilemedi: ${await response.text()}`);
}

export async function deleteCaption(videoId: string, lang: string, accessToken: string) {
  const response = await fetch(`/api/captions/${encodeURIComponent(videoId)}/${encodeURIComponent(lang)}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) throw new Error(`Altyazı silinemedi: ${await response.text()}`);
}
