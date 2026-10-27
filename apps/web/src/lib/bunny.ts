// Bunny Stream API'si (sadece sunucuda; API anahtarı tarayıcıya gitmez)
const libraryId = () => process.env.BUNNY_LIBRARY_ID!;
const apiKey = () => process.env.BUNNY_STREAM_API_KEY!;

export function bunnyFetch(path: string, init: RequestInit = {}) {
  return fetch(`https://video.bunnycdn.com/library/${libraryId()}${path}`, {
    ...init,
    headers: { Accept: "application/json", "Content-Type": "application/json", AccessKey: apiKey(), ...init.headers },
  });
}

export type Caption = { srclang: string; label: string };

export async function getCaptions(videoId: string): Promise<Caption[]> {
  const response = await bunnyFetch(`/videos/${encodeURIComponent(videoId)}`);
  if (!response.ok) return [];
  const video = (await response.json()) as { captions?: Caption[] };
  return (video.captions ?? []).map(({ srclang, label }) => ({ srclang, label }));
}
