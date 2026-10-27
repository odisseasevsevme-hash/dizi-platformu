import { getCaptions } from "@/lib/bunny";

// Bir videonun hazır altyazı dilleri
export async function GET(_request: Request, { params }: { params: Promise<{ videoId: string }> }) {
  const { videoId } = await params;
  const captions = await getCaptions(videoId);
  return Response.json(captions, { headers: { "Cache-Control": "public, s-maxage=300" } });
}
