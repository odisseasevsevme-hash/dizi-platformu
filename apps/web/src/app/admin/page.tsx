"use client";

import { useState } from "react";
import { ContentManager } from "@/components/ContentManager";
import { EpisodeForm } from "@/components/admin/EpisodeForm";
import { TitleForm } from "@/components/admin/TitleForm";
import { useIsAdmin, useSession } from "@/lib/useSession";

export default function AdminPage() {
  const { session, loading } = useSession();
  const isAdmin = useIsAdmin(session?.user.id);
  // Bir şey eklenip silindiğinde listeleri yenilemek için
  const [version, setVersion] = useState(0);
  const changed = () => setVersion((v) => v + 1);

  if (loading || (session && isAdmin === null)) return <p className="px-4 pt-24 opacity-60 sm:px-12">Yükleniyor…</p>;
  if (!session || !isAdmin) return <p className="px-4 pt-24 sm:px-12">Bu sayfa sadece yönetici içindir.</p>;

  return (
    <div className="mx-auto max-w-5xl space-y-14 px-4 pb-16 pt-24">
      <div className="grid gap-10 md:grid-cols-2">
        <TitleForm token={session.access_token} onSaved={changed} />
        <EpisodeForm token={session.access_token} version={version} onSaved={changed} />
      </div>
      <ContentManager token={session.access_token} version={version} onChanged={changed} />
    </div>
  );
}
