"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { BRAND_NAME, LOGO_SRC } from "@/lib/brand";
import { supabase } from "@/lib/supabase";
import { useIsAdmin, useSession } from "@/lib/useSession";

export function Header() {
  const { session } = useSession();
  const isAdmin = useIsAdmin(session?.user.id);
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Oynatıcıda başlık çubuğu gizli, video tüm ekranı kullanır
  if (pathname.startsWith("/watch/")) return null;

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 flex h-16 items-center justify-between px-4 transition-colors duration-300 sm:px-12 ${
        scrolled ? "bg-background" : "bg-gradient-to-b from-black/80 to-transparent"
      }`}
    >
      <div className="flex items-center gap-8">
        <Link href="/" className="text-2xl font-black tracking-tight text-accent">
          {LOGO_SRC ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={LOGO_SRC} alt={BRAND_NAME} className="h-7" />
          ) : (
            BRAND_NAME
          )}
        </Link>
        <nav className="hidden gap-5 text-sm sm:flex">
          <Link href="/" className="hover:text-white/70">Ana Sayfa</Link>
          <Link href="/#dikey" className="hover:text-white/70">Dikey Diziler</Link>
          <Link href="/#diziler" className="hover:text-white/70">Diziler</Link>
          <Link href="/#filmler" className="hover:text-white/70">Filmler</Link>
        </nav>
      </div>
      <nav className="flex items-center gap-4 text-sm">
        {isAdmin && (
          <Link href="/admin" className="rounded border border-white/40 px-3 py-1 hover:bg-white/10">
            Yükle
          </Link>
        )}
        {session ? (
          <button onClick={() => supabase.auth.signOut()} className="text-white/70 hover:text-white">
            Çıkış
          </button>
        ) : (
          <Link href="/login" className="rounded bg-accent px-3 py-1 font-semibold text-white">
            Giriş
          </Link>
        )}
      </nav>
    </header>
  );
}
