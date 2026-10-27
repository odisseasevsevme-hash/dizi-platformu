"use client";

export function MyListButton({ active, onClick, compact = false }: { active: boolean; onClick: () => void; compact?: boolean }) {
  return (
    <button
      onClick={onClick}
      aria-label={active ? "Listemden çıkar" : "Listeme ekle"}
      className={`btn-ghost flex items-center gap-2 ${compact ? "!px-4" : "!px-6 !py-3"} ${active ? "!bg-white !text-black" : ""}`}
    >
      {active ? "✓" : "+"} {compact ? "" : active ? "Listemde" : "Listem"}
    </button>
  );
}
