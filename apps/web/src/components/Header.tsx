"use client";

import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useIsAdmin, useSession } from "@/lib/useSession";

export function Header() {
  const { session } = useSession();
  const isAdmin = useIsAdmin(session?.user.id);

  return (
    <header className="flex items-center justify-between border-b border-white/10 px-4 py-3 sm:px-8">
      <Link href="/" className="text-xl font-bold text-accent">
        DİZİ
      </Link>
      <nav className="flex items-center gap-4 text-sm">
        {isAdmin && <Link href="/admin">Yükle</Link>}
        {session ? (
          <button onClick={() => supabase.auth.signOut()} className="opacity-70 hover:opacity-100">
            Çıkış
          </button>
        ) : (
          <Link href="/login">Giriş</Link>
        )}
      </nav>
    </header>
  );
}
