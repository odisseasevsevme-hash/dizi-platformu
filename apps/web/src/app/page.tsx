"use client";

import { useEffect, useState } from "react";
import { PosterCard } from "@/components/PosterCard";
import { supabase } from "@/lib/supabase";
import type { Title } from "@/lib/types";

export default function Home() {
  const [titles, setTitles] = useState<Title[] | null>(null);

  useEffect(() => {
    supabase
      .from("titles")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data }) => setTitles(data ?? []));
  }, []);

  if (!titles) return <p className="opacity-60">Yükleniyor…</p>;
  if (titles.length === 0) return <p className="opacity-60">Henüz içerik yok.</p>;

  const series = titles.filter((t) => t.kind === "series");
  const films = titles.filter((t) => t.kind === "film");

  return (
    <div className="space-y-10">
      {series.length > 0 && <Row heading="Diziler" titles={series} />}
      {films.length > 0 && <Row heading="Filmler" titles={films} />}
    </div>
  );
}

function Row({ heading, titles }: { heading: string; titles: Title[] }) {
  return (
    <section>
      <h2 className="mb-3 text-lg font-semibold">{heading}</h2>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
        {titles.map((t) => (
          <PosterCard key={t.id} title={t} />
        ))}
      </div>
    </section>
  );
}
