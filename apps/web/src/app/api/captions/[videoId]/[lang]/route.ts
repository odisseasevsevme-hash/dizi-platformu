import { bunnyFetch } from "@/lib/bunny";
import { requireAdmin } from "@/lib/requireAdmin";

type Params = { params: Promise<{ videoId: string; lang: string }> };

// Altyazı dosyasını kendi adresimizden sunar; böylece tarayıcı başka siteden
// altyazı yükleme kısıtlamasına (CORS) takılmaz.
export async function GET(_request: Request, { params }: Params) {
  const { videoId, lang } = await params;
  const hostname = (process.env.NEXT_PUBLIC_BUNNY_CDN_HOSTNAME ?? "").replace(/^https?:\/\//, "").replace(/\/+$/, "");
  // Düzenlenen altyazının eski hâli önbellekten gelmesin diye her seferinde farklı adres
  const response = await fetch(
    `https://${hostname}/${encodeURIComponent(videoId)}/captions/${encodeURIComponent(lang)}.vtt?v=${Date.now()}`,
    { headers: { Referer: `https://${hostname}/` }, cache: "no-store" },
  );
  if (!response.ok) return new Response("Altyazı bulunamadı", { status: 404 });
  return new Response(await response.text(), {
    headers: { "Content-Type": "text/vtt; charset=utf-8", "Cache-Control": "no-store" },
  });
}

// Yönetici: altyazıyı yükler ya da düzeltilmiş hâliyle değiştirir. Gövde: { label, text } (WebVTT metni)
export async function PUT(request: Request, { params }: Params) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  const { videoId, lang } = await params;
  const { label, text } = (await request.json()) as { label?: string; text?: string };
  if (!text?.trim()) return new Response("Altyazı metni boş", { status: 400 });

  const response = await bunnyFetch(`/videos/${encodeURIComponent(videoId)}/captions/${encodeURIComponent(lang)}`, {
    method: "POST",
    body: JSON.stringify({ srclang: lang, label: label || lang, captionsFile: Buffer.from(text, "utf-8").toString("base64") }),
  });
  if (!response.ok) return new Response(await response.text(), { status: 502 });
  return Response.json({ ok: true });
}

// Yönetici: altyazıyı siler
export async function DELETE(request: Request, { params }: Params) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  const { videoId, lang } = await params;
  const response = await bunnyFetch(`/videos/${encodeURIComponent(videoId)}/captions/${encodeURIComponent(lang)}`, {
    method: "DELETE",
  });
  if (!response.ok && response.status !== 404) return new Response(await response.text(), { status: 502 });
  return Response.json({ ok: true });
}
