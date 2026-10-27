// Bunny Stream adresleri (web ile aynı)
const base = `https://${process.env.EXPO_PUBLIC_BUNNY_CDN_HOSTNAME}`;

export function hlsUrl(videoId: string) {
  return `${base}/${videoId}/playlist.m3u8`;
}

export function thumbnailUrl(videoId: string) {
  return `${base}/${videoId}/thumbnail.jpg`;
}

export function posterFor(title: { poster_url: string | null; video_uid: string | null }) {
  if (title.poster_url) return title.poster_url;
  if (title.video_uid) return thumbnailUrl(title.video_uid);
  return null;
}
