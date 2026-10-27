import { createClient } from "@supabase/supabase-js";

// İsteği yapanın yönetici olduğunu doğrular. Değilse döndürülecek hata yanıtını verir.
export async function requireAdmin(request: Request): Promise<Response | null> {
  const token = request.headers.get("authorization")?.replace(/^Bearer /, "");
  if (!token) return new Response("Giriş gerekli", { status: 401 });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } },
  );
  const { data: isAdmin, error } = await supabase.rpc("is_admin");
  if (error || !isAdmin) return new Response("Yetkisiz", { status: 403 });
  return null;
}
