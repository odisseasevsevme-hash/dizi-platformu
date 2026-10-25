export type Title = {
  id: string;
  kind: "film" | "series";
  name: string;
  description: string | null;
  year: number | null;
  poster_url: string | null;
  video_uid: string | null;
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
};

export type WatchProgress = {
  video_uid: string;
  position_seconds: number;
  duration_seconds: number | null;
};
