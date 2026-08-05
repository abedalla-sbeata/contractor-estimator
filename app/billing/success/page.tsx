"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n";

export default function BillingSuccessPage() {
  const { t } = useI18n();
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-2xl text-emerald-700">
        ✓
      </div>
      <h1 className="mt-6 font-display text-3xl font-bold text-navy-900">
        {t("billing.successTitle")}
      </h1>
      <p className="mt-3 text-steel-600">{t("billing.successBody")}</p>
      <Link
        href="/dashboard"
        className="mt-8 inline-flex rounded-lg bg-navy-900 px-5 py-3 text-sm font-bold text-white transition hover:bg-navy-800"
      >
        {t("billing.backDashboard")}
      </Link>
    </div>
  );
}
