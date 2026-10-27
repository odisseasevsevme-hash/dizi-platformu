// Altyazı dosyasını kendi adresimizden sunar; böylece tarayıcı başka siteden
// altyazı yükleme kısıtlamasına (CORS) takılmaz.
export async function GET(_request: Request, { params }: { params: Promise<{ videoId: string; lang: string }> }) {
  const { videoId, lang } = await params;
  const hostname = (process.env.NEXT_PUBLIC_BUNNY_CDN_HOSTNAME ?? "").replace(/^https?:\/\//, "").replace(/\/+$/, "");
  const response = await fetch(
    `https://${hostname}/${encodeURIComponent(videoId)}/captions/${encodeURIComponent(lang)}.vtt`,
    { headers: { Referer: `https://${hostname}/` } },
  );
  if (!response.ok) return new Response("Altyazı bulunamadı", { status: 404 });
  return new Response(await response.text(), {
    headers: { "Content-Type": "text/vtt; charset=utf-8", "Cache-Control": "public, s-maxage=300" },
  });
}
