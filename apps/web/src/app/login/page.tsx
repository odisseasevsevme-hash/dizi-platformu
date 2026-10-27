"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    const { data, error } =
      mode === "login"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });
    setBusy(false);
    if (error) return setMessage(error.message);
    if (!data.session) return setMessage("E-postana gelen onay bağlantısına tıkla, sonra giriş yap.");
    router.push("/");
  }

  return (
    <form onSubmit={submit} className="mx-auto max-w-sm space-y-4 px-4 pt-28">
      <h1 className="text-2xl font-bold">{mode === "login" ? "Giriş yap" : "Kayıt ol"}</h1>
      <input className="input" type="email" placeholder="E-posta" value={email} onChange={(e) => setEmail(e.target.value)} required />
      <input className="input" type="password" placeholder="Şifre" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
      <button className="btn w-full" disabled={busy}>
        {mode === "login" ? "Giriş yap" : "Kayıt ol"}
      </button>
      {message && <p className="text-sm opacity-80">{message}</p>}
      <button
        type="button"
        className="text-sm opacity-60 hover:opacity-100"
        onClick={() => setMode(mode === "login" ? "signup" : "login")}
      >
        {mode === "login" ? "Hesabın yok mu? Kayıt ol" : "Hesabın var mı? Giriş yap"}
      </button>
    </form>
  );
}
