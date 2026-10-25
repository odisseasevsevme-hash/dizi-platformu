import { createClient } from "@supabase/supabase-js";

// tus yükleme başlatma noktası. Tarayıcıdaki tus istemcisi önce buraya POST atar;
// biz yöneticiyi doğrulayıp Cloudflare Stream'den tek kullanımlık bir yükleme adresi
// alırız. Dosyanın kendisi doğrudan Cloudflare'e gider, sunucumuzdan geçmez.
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

  const uploadLength = request.headers.get("upload-length");
  if (!uploadLength) return new Response("Upload-Length eksik", { status: 400 });

  const cfResponse = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${process.env.CF_ACCOUNT_ID}/stream?direct_user=true`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.CF_STREAM_API_TOKEN}`,
        "Tus-Resumable": "1.0.0",
        "Upload-Length": uploadLength,
        "Upload-Metadata": request.headers.get("upload-metadata") ?? "",
      },
    },
  );

  const location = cfResponse.headers.get("location");
  const mediaId = cfResponse.headers.get("stream-media-id");
  if (!cfResponse.ok || !location || !mediaId) {
    return new Response(`Cloudflare hatası: ${await cfResponse.text()}`, { status: 502 });
  }

  return new Response(null, {
    status: 201,
    headers: {
      "Access-Control-Expose-Headers": "Location, Stream-Media-Id",
      Location: location,
      "Stream-Media-Id": mediaId,
    },
  });
}
