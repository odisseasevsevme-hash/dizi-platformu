"use client";

import { useEffect, useState } from "react";
import { TitleCard } from "@/components/TitleCard";
import { supabase } from "@/lib/supabase";
import type { TitleWithEpisodes } from "@/lib/types";

// Türkçe karakterlere duyarsız arama için
const normalize = (text: string) => text.toLocaleLowerCase("tr").normalize("NFD").replace(/\p{Diacritic}/gu, "");

export default function SearchPage() {
  const [titles, setTitles] = useState<TitleWithEpisodes[]>([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    supabase
      .from("titles")
      .select("*, episodes(video_uid, season, number)")
      .order("created_at", { ascending: false })
      .then(({ data }) => setTitles(data ?? []));
  }, []);

  const q = normalize(query.trim());
  const genres = [...new Set(titles.flatMap((t) => t.genres ?? []))];
  const results = q
    ? titles.filter((t) => normalize([t.name, t.description ?? "", ...(t.genres ?? [])].join(" ")).includes(q))
    : titles;

  return (
    <div className="space-y-6 px-4 pb-16 pt-24 sm:px-12">
      <input
        autoFocus
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="🔍 Dizi, film ya da tür ara…"
        className="input !rounded-full !py-3 text-lg"
      />
      {genres.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {genres.map((g) => (
            <button key={g} onClick={() => setQuery(g)} className={`chip ${normalize(g) === q ? "chip-active" : ""}`}>
              {g}
            </button>
          ))}
        </div>
      )}
      {q && results.length === 0 && <p className="text-white/60">&quot;{query}&quot; için sonuç bulunamadı.</p>}
      <div className="flex flex-wrap gap-3">
        {results.map((t) => (
          <TitleCard key={t.id} title={t} shape={t.orientation === "vertical" ? "portrait" : "landscape"} />
        ))}
      </div>
    </div>
  );
}
