export type Title = {
  id: string;
  kind: "film" | "series";
  name: string;
  description: string | null;
  year: number | null;
  poster_url: string | null;
  // Yatay (16:9) arka plan görseli
  backdrop_url: string | null;
  // Fragmanın Bunny video kimliği
  trailer_uid: string | null;
  // 0003 göçü çalıştırılmadan önce null gelebilir
  genres: string[] | null;
  video_uid: string | null;
  orientation: "horizontal" | "vertical";
  featured: boolean;
  created_at: string;
};

export type TitleWithEpisodes = Title & {
  episodes: Pick<Episode, "video_uid" | "season" | "number">[];
};

export type Episode = {
  id: string;
  title_id: string;
  season: number;
  number: number;
  name: string | null;
  description: string | null;
  video_uid: string;
  // Jenerik aralığı (saniye); varsa "Jeneriği atla" çıkar
  intro_start_seconds: number | null;
  intro_end_seconds: number | null;
};

export type WatchProgress = {
  video_uid: string;
  position_seconds: number;
  duration_seconds: number | null;
  updated_at?: string;
};
