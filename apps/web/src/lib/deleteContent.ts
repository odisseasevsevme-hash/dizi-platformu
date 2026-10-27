"use client";

import { supabase } from "./supabase";

async function deleteVideos(videoIds: string[], accessToken: string) {
  if (videoIds.length === 0) return;
  const response = await fetch("/api/videos", {
    method: "DELETE",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ videoIds }),
  });
  if (!response.ok) throw new Error(`Videolar silinemedi: ${await response.text()}`);
}

async function deletePoster(posterUrl: string | null) {
  const path = posterUrl?.split("/posters/")[1];
  if (path) await supabase.storage.from("posters").remove([decodeURIComponent(path)]);
}

// Önce videolar silinir; kayıt sonra silinir ki yarıda kalırsa tekrar denenebilsin
export async function deleteTitle(
  title: { id: string; video_uid: string | null; poster_url: string | null },
  accessToken: string,
) {
  const { data: episodes } = await supabase.from("episodes").select("video_uid").eq("title_id", title.id);
  const videoIds = [...(episodes ?? []).map((e) => e.video_uid), ...(title.video_uid ? [title.video_uid] : [])];
  await deleteVideos(videoIds, accessToken);
  const { error } = await supabase.from("titles").delete().eq("id", title.id);
  if (error) throw error;
  await deletePoster(title.poster_url);
}

export async function deleteEpisode(episode: { id: string; video_uid: string }, accessToken: string) {
  await deleteVideos([episode.video_uid], accessToken);
  const { error } = await supabase.from("episodes").delete().eq("id", episode.id);
  if (error) throw error;
}
