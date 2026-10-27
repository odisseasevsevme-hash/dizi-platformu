"use client";

import { LANGUAGES } from "@/lib/languages";
import type { SubtitleRequest } from "@/lib/adminApi";

type Props = { value: SubtitleRequest; onChange: (value: SubtitleRequest) => void };

// Otomatik altyazı dilleri. Bunny dil başına dakika ücreti alır, varsayılan olarak hiçbiri seçili değildir.
export function SubtitlePicker({ value, onChange }: Props) {
  const toggle = (code: string) =>
    onChange({
      ...value,
      targetLanguages: value.targetLanguages.includes(code)
        ? value.targetLanguages.filter((c) => c !== code)
        : [...value.targetLanguages, code],
    });

  return (
    <fieldset className="space-y-2 rounded-2xl border border-white/10 p-3">
      <legend className="px-1 text-sm font-semibold">💬 Otomatik altyazı (isteğe bağlı, ücretli)</legend>
      <label className="flex items-center gap-2 text-sm text-white/70">
        Videodaki konuşma dili
        <select
          value={value.sourceLanguage}
          onChange={(e) => onChange({ ...value, sourceLanguage: e.target.value })}
          className="rounded-full border border-white/20 bg-surface px-3 py-1 text-white"
        >
          {LANGUAGES.map((l) => (
            <option key={l.code} value={l.code}>
              {l.label}
            </option>
          ))}
        </select>
      </label>
      <div className="flex flex-wrap gap-2">
        {LANGUAGES.map((l) => (
          <button
            key={l.code}
            type="button"
            onClick={() => toggle(l.code)}
            className={`chip !px-3 text-xs ${value.targetLanguages.includes(l.code) ? "chip-active" : ""}`}
          >
            {l.label}
          </button>
        ))}
      </div>
      <p className="text-xs text-white/50">
        Bunny dil başına dakikada yaklaşık 0,10$ alır. {value.targetLanguages.length} dil seçili.
      </p>
    </fieldset>
  );
}

export const NO_SUBTITLES: SubtitleRequest = { sourceLanguage: "tr", targetLanguages: [] };
