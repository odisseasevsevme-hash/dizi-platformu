import { bunnyFetch } from "@/lib/bunny";
import { requireAdmin } from "@/lib/requireAdmin";

// Bunny'nin yapay zekâsıyla altyazı oluşturur ve seçilen dillere çevirir (ücretli)
export async function POST(request: Request) {
  const denied = await requireAdmin(request);
  if (denied) return denied;

  const { videoIds, sourceLanguage, targetLanguages, force } = (await request.json()) as {
    videoIds?: string[];
    sourceLanguage?: string;
    targetLanguages?: string[];
    force?: boolean;
  };
  if (!Array.isArray(videoIds) || !Array.isArray(targetLanguages) || targetLanguages.length === 0) {
    return new Response("videoIds ve targetLanguages gerekli", { status: 400 });
  }

  const failed: { id: string; message: string }[] = [];
  for (const id of videoIds) {
    const response = await bunnyFetch(`/videos/${encodeURIComponent(id)}/transcribe${force ? "?force=true" : ""}`, {
      method: "POST",
      body: JSON.stringify({ sourceLanguage: sourceLanguage || null, targetLanguages }),
    });
    if (!response.ok) failed.push({ id, message: await response.text() });
  }

  if (failed.length) return Response.json({ failed }, { status: 502 });
  return Response.json({ ok: true });
}
