import { posterFor, thumbnailUrl } from "./stream";
import type { TitleWithEpisodes } from "./types";

// Filmin videosu ya da dizinin ilk bölümü
export function firstVideo(title: TitleWithEpisodes): string | null {
  if (title.video_uid) return title.video_uid;
  const [first] = [...title.episodes].sort((a, b) => a.season - b.season || a.number - b.number);
  return first?.video_uid ?? null;
}

// Yatay kartlar ve büyük afiş için: önce videodan bir kare, yoksa kapak
export function landscapeImage(title: TitleWithEpisodes): string | null {
  const video = firstVideo(title);
  return video ? thumbnailUrl(video) : title.poster_url;
}

// Dikey kartlar için: önce kapak, yoksa videodan bir kare
export function portraitImage(title: TitleWithEpisodes): string | null {
  if (title.poster_url) return title.poster_url;
  const video = firstVideo(title);
  return video ? thumbnailUrl(video) : posterFor(title);
}

export function watchHref(videoUid: string) {
  return `/watch/${videoUid}`;
}
