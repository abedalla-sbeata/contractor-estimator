"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n";

/** Shown when contractor self-serve portal routes are disabled (not deleted). */
export function ContractorPortalDisabled() {
  const { t } = useI18n();

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 py-16 text-center animate-fade-in">
      <h1 className="font-display text-3xl font-bold text-navy-900">
        {t("portal.disabledTitle")}
      </h1>
      <p className="mt-3 text-steel-600">{t("portal.disabledBody")}</p>
      <Link
        href="/"
        className="mt-8 inline-flex items-center justify-center rounded-lg bg-navy-900 px-5 py-3 text-sm font-bold text-white transition hover:bg-navy-800"
      >
        {t("common.backHome")}
      </Link>
    </div>
  );
}
