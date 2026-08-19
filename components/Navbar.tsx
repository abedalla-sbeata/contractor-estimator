"use client";

import Link from "next/link";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useI18n } from "@/lib/i18n";

export function Navbar() {
  const { t } = useI18n();

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-navy-950/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link
          href="/"
          className="font-display text-lg font-bold tracking-tight text-white sm:text-xl"
        >
          {t("brand")}
        </Link>

        <nav className="flex items-center gap-2 sm:gap-3">
          <LanguageSwitcher />
        </nav>
      </div>
    </header>
  );
}
