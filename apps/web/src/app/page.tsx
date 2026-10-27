"use client";

import { useEffect, useState } from "react";
import { ContinueWatching } from "@/components/ContinueWatching";
import { Hero } from "@/components/Hero";
import { Row } from "@/components/Row";
import { TitleCard } from "@/components/TitleCard";
import { firstVideo } from "@/lib/catalog";
import { supabase } from "@/lib/supabase";
import type { TitleWithEpisodes } from "@/lib/types";
import { useMyList } from "@/lib/useMyList";
import { useProgress } from "@/lib/useProgress";

export default function Home() {
  const [titles, setTitles] = useState<TitleWithEpisodes[] | null>(null);
  const progress = useProgress();
  const myList = useMyList();

  useEffect(() => {
    supabase
      .from("titles")
      .select("*, episodes(video_uid, season, number)")
      .order("created_at", { ascending: false })
      .then(({ data }) => setTitles(data ?? []));
  }, []);

  if (!titles) return <div className="h-[80vh] animate-pulse bg-white/5" />;
  if (titles.length === 0) {
    return <p className="px-4 pt-28 text-white/60 sm:px-12">Henüz içerik yok. Yükle sayfasından ilk dizini ekle.</p>;
  }

  const playable = titles.filter((t) => firstVideo(t));
  const featured = playable.find((t) => t.featured) ?? playable[0] ?? titles[0];
  const listed = myList.ids.map((id) => titles.find((t) => t.id === id)).filter((t) => t !== undefined);
  const vertical = titles.filter((t) => t.orientation === "vertical");
  const horizontal = titles.filter((t) => t.orientation === "horizontal");
  const series = horizontal.filter((t) => t.kind === "series");
  const films = horizontal.filter((t) => t.kind === "film");
  const genres = [...new Set(titles.flatMap((t) => t.genres ?? []))].sort((a, b) => a.localeCompare(b, "tr"));

  const card = (t: TitleWithEpisodes) => (
    <TitleCard key={t.id} title={t} shape={t.orientation === "vertical" ? "portrait" : "landscape"} />
  );

  return (
    <div className="pb-16">
      <Hero
        title={featured}
        progress={progress}
        inMyList={myList.ids.includes(featured.id)}
        onToggleMyList={() => myList.toggle(featured.id)}
      />
      <div className="relative z-10 -mt-24 space-y-8 sm:space-y-10">
        <ContinueWatching titles={titles} progress={progress} />
        {listed.length > 0 && (
          <Row id="listem" heading="❤️ Listem">
            {listed.map(card)}
          </Row>
        )}
        {vertical.length > 0 && (
          <Row id="dikey" heading="📱 Dikey Diziler">
            {vertical.map((t) => <TitleCard key={t.id} title={t} shape="portrait" />)}
          </Row>
        )}
        {series.length > 0 && (
          <Row id="diziler" heading="🍿 Diziler">
            {series.map((t) => <TitleCard key={t.id} title={t} shape="landscape" />)}
          </Row>
        )}
        {films.length > 0 && (
          <Row id="filmler" heading="🎬 Filmler">
            {films.map((t) => <TitleCard key={t.id} title={t} shape="landscape" />)}
          </Row>
        )}
        {genres.map((genre) => (
          <Row key={genre} heading={genre}>
            {titles.filter((t) => t.genres?.includes(genre)).map(card)}
          </Row>
        ))}
      </div>
    </div>
  );
}
