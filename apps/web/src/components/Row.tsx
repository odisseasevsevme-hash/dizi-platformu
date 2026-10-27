"use client";

import { useRef } from "react";

export function Row({ id, heading, children }: { id?: string; heading: string; children: React.ReactNode }) {
  const scroller = useRef<HTMLDivElement>(null);
  const scroll = (direction: 1 | -1) =>
    scroller.current?.scrollBy({ left: direction * scroller.current.clientWidth * 0.8, behavior: "smooth" });

  return (
    <section id={id} className="group/row relative scroll-mt-20">
      <h2 className="mb-2 px-4 text-lg font-semibold sm:px-12 sm:text-xl">{heading}</h2>
      <div ref={scroller} className="no-scrollbar flex snap-x gap-2 overflow-x-auto scroll-px-4 px-4 pb-2 sm:scroll-px-12 sm:px-12">
        {children}
      </div>
      <ArrowButton side="left" onClick={() => scroll(-1)} />
      <ArrowButton side="right" onClick={() => scroll(1)} />
    </section>
  );
}

function ArrowButton({ side, onClick }: { side: "left" | "right"; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label={side === "left" ? "Geri" : "İleri"}
      className={`absolute bottom-2 top-9 z-10 hidden w-10 items-center justify-center bg-black/50 text-3xl opacity-0 transition group-hover/row:opacity-100 sm:flex ${
        side === "left" ? "left-0" : "right-0"
      }`}
    >
      {side === "left" ? "‹" : "›"}
    </button>
  );
}
