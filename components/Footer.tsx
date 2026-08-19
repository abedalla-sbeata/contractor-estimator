"use client";

import { useI18n } from "@/lib/i18n";

export function Footer() {
  const { t } = useI18n();
  return (
    <footer className="border-t border-steel-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 text-sm text-steel-500 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p className="font-display font-semibold text-navy-900">{t("brand")}</p>
        <p>{t("landing.trustLine")}</p>
      </div>
    </footer>
  );
}
