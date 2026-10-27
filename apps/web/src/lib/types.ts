export type Title = {
  id: string;
  kind: "film" | "series";
  name: string;
  description: string | null;
  year: number | null;
  poster_url: string | null; // dikey kapak
  backdrop_url: string | null; // yatay arka plan görseli
  video_uid: string | null; // sadece filmlerde
  trailer_uid: string | null;
  // 0003 göçü çalıştırılmadan önce null gelebilir
  genres: string[] | null;
  orientation: "horizontal" | "vertical";
  featured: boolean;
  created_at: string;
};

export type Episode = {
  id: string;
  title_id: string;
  season: number;
  number: number;
  name: string | null;
  description: string | null;
  video_uid: string;
  intro_start_seconds: number | null;
  intro_end_seconds: number | null;
};

export type TitleWithEpisodes = Title & {
  episodes: Pick<Episode, "video_uid" | "season" | "number">[];
};

export type WatchProgress = {
  video_uid: string;
  position_seconds: number;
  duration_seconds: number | null;
  updated_at?: string;
};
