"use client";

import { useI18n } from "@/lib/i18n";
import type { Language } from "@/lib/types";

export function LanguageSwitcher({ className = "" }: { className?: string }) {
  const { language, setLanguage } = useI18n();

  const options: { code: Language; label: string }[] = [
    { code: "en", label: "EN" },
    { code: "es", label: "ES" },
  ];

  return (
    <div
      className={`inline-flex rounded-md border border-steel-200 bg-white p-0.5 text-sm font-medium shadow-sm ${className}`}
      role="group"
      aria-label="Language"
    >
      {options.map((opt) => {
        const active = language === opt.code;
        return (
          <button
            key={opt.code}
            type="button"
            onClick={() => setLanguage(opt.code)}
            className={`min-w-[2.5rem] rounded px-2.5 py-1 transition ${
              active
                ? "bg-navy-900 text-white"
                : "text-steel-600 hover:bg-steel-50 hover:text-navy-900"
            }`}
            aria-pressed={active}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
