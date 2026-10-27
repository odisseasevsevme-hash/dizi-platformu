import { bunnyFetch } from "@/lib/bunny";
import { requireAdmin } from "@/lib/requireAdmin";

// Videoları Bunny Stream'den kalıcı olarak siler, böylece depolama ücreti işlemez.
export async function DELETE(request: Request) {
  const denied = await requireAdmin(request);
  if (denied) return denied;

  const { videoIds } = (await request.json()) as { videoIds?: string[] };
  if (!Array.isArray(videoIds)) return new Response("videoIds eksik", { status: 400 });

  const failed: string[] = [];

  await Promise.all(
    videoIds.map(async (id) => {
      const response = await bunnyFetch(`/videos/${encodeURIComponent(id)}`, { method: "DELETE" });
      // Zaten silinmiş bir video sorun değil
      if (!response.ok && response.status !== 404) failed.push(id);
    }),
  );

  if (failed.length) return Response.json({ failed }, { status: 502 });
  return Response.json({ ok: true });
}
