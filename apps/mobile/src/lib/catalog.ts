import { thumbnailUrl } from './stream';
import type { TitleWithEpisodes } from './types';

// Filmin videosu ya da dizinin ilk bölümü
export function firstVideo(title: TitleWithEpisodes): string | null {
  if (title.video_uid) return title.video_uid;
  const [first] = [...title.episodes].sort((a, b) => a.season - b.season || a.number - b.number);
  return first?.video_uid ?? null;
}

export function landscapeImage(title: TitleWithEpisodes): string | null {
  const video = firstVideo(title);
  return video ? thumbnailUrl(video) : title.poster_url;
}

export function portraitImage(title: TitleWithEpisodes): string | null {
  if (title.poster_url) return title.poster_url;
  const video = firstVideo(title);
  return video ? thumbnailUrl(video) : null;
}
