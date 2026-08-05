"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSyncExternalStore } from "react";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useI18n } from "@/lib/i18n";
import { clearToken, isAuthenticated, subscribeAuth } from "@/lib/auth";

export function Navbar() {
  const { t } = useI18n();
  const router = useRouter();
  const authed = useSyncExternalStore(
    subscribeAuth,
    isAuthenticated,
    () => false
  );

  function logout() {
    clearToken();
    router.push("/");
  }

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
          <Link
            href="/estimate"
            className="hidden rounded-lg px-3 py-2 text-sm font-semibold text-white/90 transition hover:bg-white/10 hover:text-white sm:inline-flex"
          >
            {t("nav.getEstimate")}
          </Link>
          {authed ? (
            <>
              <Link
                href="/dashboard"
                className="rounded-lg bg-white/10 px-3 py-2 text-sm font-semibold text-white transition hover:bg-white/15"
              >
                {t("nav.dashboard")}
              </Link>
              <button
                type="button"
                onClick={logout}
                className="rounded-lg px-3 py-2 text-sm font-medium text-white/70 transition hover:text-white"
              >
                {t("nav.logout")}
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-lg px-3 py-2 text-sm font-medium text-white/80 transition hover:text-white"
              >
                {t("nav.login")}
              </Link>
              <Link
                href="/register"
                className="rounded-lg bg-accent-500 px-3 py-2 text-sm font-semibold text-white transition hover:bg-accent-600"
              >
                {t("nav.register")}
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
