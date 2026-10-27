import { requireAdmin } from "@/lib/requireAdmin";

// Videoları Bunny Stream'den kalıcı olarak siler, böylece depolama ücreti işlemez.
export async function DELETE(request: Request) {
  const denied = await requireAdmin(request);
  if (denied) return denied;

  const { videoIds } = (await request.json()) as { videoIds?: string[] };
  if (!Array.isArray(videoIds)) return new Response("videoIds eksik", { status: 400 });

  const libraryId = process.env.BUNNY_LIBRARY_ID!;
  const apiKey = process.env.BUNNY_STREAM_API_KEY!;
  const failed: string[] = [];

  await Promise.all(
    videoIds.map(async (id) => {
      const response = await fetch(`https://video.bunnycdn.com/library/${libraryId}/videos/${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: { AccessKey: apiKey },
      });
      // Zaten silinmiş bir video sorun değil
      if (!response.ok && response.status !== 404) failed.push(id);
    }),
  );

  if (failed.length) return Response.json({ failed }, { status: 502 });
  return Response.json({ ok: true });
}
