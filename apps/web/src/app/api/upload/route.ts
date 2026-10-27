import { createHash } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const UPLOAD_VALID_SECONDS = 24 * 60 * 60;

// Yükleme izni verir. Yöneticiyi doğrular, Bunny Stream'de boş bir video oluşturur
// ve tarayıcının dosyayı doğrudan Bunny'ye yükleyebilmesi için imza üretir.
// API anahtarı sunucuda kalır, dosyanın kendisi sunucumuzdan geçmez.
export async function POST(request: Request) {
  const token = request.headers.get("authorization")?.replace(/^Bearer /, "");
  if (!token) return new Response("Giriş gerekli", { status: 401 });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } },
  );
  const { data: isAdmin, error } = await supabase.rpc("is_admin");
  if (error || !isAdmin) return new Response("Yetkisiz", { status: 403 });

  const { title } = (await request.json()) as { title?: string };
  const libraryId = process.env.BUNNY_LIBRARY_ID!;
  const apiKey = process.env.BUNNY_STREAM_API_KEY!;

  const bunnyResponse = await fetch(`https://video.bunnycdn.com/library/${libraryId}/videos`, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json", AccessKey: apiKey },
    body: JSON.stringify({ title: title || "Video" }),
  });
  if (!bunnyResponse.ok) {
    return new Response(`Bunny hatası: ${await bunnyResponse.text()}`, { status: 502 });
  }
  const { guid: videoId } = (await bunnyResponse.json()) as { guid: string };

  const expirationTime = Math.floor(Date.now() / 1000) + UPLOAD_VALID_SECONDS;
  const signature = createHash("sha256")
    .update(`${libraryId}${apiKey}${expirationTime}${videoId}`)
    .digest("hex");

  return Response.json({ videoId, libraryId, expirationTime, signature });
}
