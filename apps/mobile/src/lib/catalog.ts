import { thumbnailUrl } from './stream';
import type { Title, TitleWithEpisodes, WatchProgress } from './types';

type EpisodeRef = TitleWithEpisodes['episodes'][number];

export function sortedEpisodes<T extends EpisodeRef>(episodes: T[]): T[] {
  return [...episodes].sort((a, b) => a.season - b.season || a.number - b.number);
}

// Filmin videosu ya da dizinin ilk bölümü
export function firstVideo(title: TitleWithEpisodes): string | null {
  if (title.video_uid) return title.video_uid;
  return sortedEpisodes(title.episodes)[0]?.video_uid ?? null;
}

// Yatay kartlar ve büyük afiş için: yatay görsel, yoksa videodan bir kare, yoksa kapak
export function landscapeImage(title: TitleWithEpisodes): string | null {
  if (title.backdrop_url) return title.backdrop_url;
  const video = firstVideo(title);
  return video ? thumbnailUrl(video) : title.poster_url;
}

// Dikey kartlar için: kapak, yoksa videodan bir kare
export function portraitImage(title: TitleWithEpisodes): string | null {
  if (title.poster_url) return title.poster_url;
  const video = firstVideo(title);
  return video ? thumbnailUrl(video) : title.backdrop_url;
}

export function isFinished(p: WatchProgress) {
  return !!p.duration_seconds && p.position_seconds > p.duration_seconds - 30;
}

export type ResumeTarget = { videoUid: string; label: string; resumed: boolean };

// Netflix'teki gibi: en son izlenen bölüme devam, bittiyse sonrakine geç, hiç izlenmediyse baştan
export function resumeTarget(
  title: Pick<Title, 'kind' | 'video_uid'> & { episodes: EpisodeRef[] },
  progress: WatchProgress[],
): ResumeTarget | null {
  if (title.kind === 'film') {
    if (!title.video_uid) return null;
    const p = progress.find((x) => x.video_uid === title.video_uid);
    const resumed = !!p && !isFinished(p) && p.position_seconds > 5;
    return { videoUid: title.video_uid, label: resumed ? 'Devam et' : 'Oynat', resumed };
  }

  const episodes = sortedEpisodes(title.episodes);
  if (episodes.length === 0) return null;
  // progress listesi en yeniden eskiye sıralı gelir
  const last = progress.find((p) => episodes.some((e) => e.video_uid === p.video_uid));
  if (!last) return { videoUid: episodes[0].video_uid, label: '1. bölümden başla', resumed: false };

  const index = episodes.findIndex((e) => e.video_uid === last.video_uid);
  const target = isFinished(last) ? episodes[index + 1] : episodes[index];
  if (!target) return { videoUid: episodes[0].video_uid, label: 'Baştan izle', resumed: false };
  return { videoUid: target.video_uid, label: `Devam et S${target.season}:B${target.number}`, resumed: true };
}
