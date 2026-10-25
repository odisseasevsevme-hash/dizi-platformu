// Cloudflare Stream adresleri. Müşteri kodu Stream panelinde,
// "customer-XXXX.cloudflarestream.com" şeklinde görünür.
const base = `https://customer-${process.env.NEXT_PUBLIC_CF_STREAM_CUSTOMER_CODE}.cloudflarestream.com`;

export function hlsUrl(videoUid: string) {
  return `${base}/${videoUid}/manifest/video.m3u8`;
}

export function thumbnailUrl(videoUid: string, time = "10s") {
  return `${base}/${videoUid}/thumbnails/thumbnail.jpg?time=${time}&height=480`;
}

export function posterFor(title: { poster_url: string | null; video_uid: string | null }) {
  if (title.poster_url) return title.poster_url;
  if (title.video_uid) return thumbnailUrl(title.video_uid);
  return null;
}
