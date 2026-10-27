"use client";

import { deleteImage, deleteVideos } from "./adminApi";
import { supabase } from "./supabase";
import type { Title } from "./types";

// Önce videolar silinir; kayıt sonra silinir ki yarıda kalırsa tekrar denenebilsin
export async function deleteTitle(
  title: Pick<Title, "id" | "video_uid" | "trailer_uid" | "poster_url" | "backdrop_url">,
  accessToken: string,
) {
  const { data: episodes } = await supabase.from("episodes").select("video_uid").eq("title_id", title.id);
  const videoIds = [
    ...(episodes ?? []).map((e) => e.video_uid),
    ...[title.video_uid, title.trailer_uid].filter((id): id is string => !!id),
  ];
  await deleteVideos(videoIds, accessToken);
  const { error } = await supabase.from("titles").delete().eq("id", title.id);
  if (error) throw error;
  await deleteImage(title.poster_url);
  await deleteImage(title.backdrop_url);
}

export async function deleteEpisode(episode: { id: string; video_uid: string }, accessToken: string) {
  await deleteVideos([episode.video_uid], accessToken);
  const { error } = await supabase.from("episodes").delete().eq("id", episode.id);
  if (error) throw error;
}
