"use client";

import Link from "next/link";
import { ContractorPortalDisabled } from "@/components/ContractorPortalDisabled";
import { CONTRACTOR_PORTAL_ENABLED } from "@/lib/features";
import { useI18n } from "@/lib/i18n";

export default function BillingCancelPage() {
  const { t } = useI18n();

  if (!CONTRACTOR_PORTAL_ENABLED) {
    return <ContractorPortalDisabled />;
  }

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 py-16 text-center">
      <h1 className="font-display text-3xl font-bold text-navy-900">
        {t("billing.cancelTitle")}
      </h1>
      <p className="mt-3 text-steel-600">{t("billing.cancelBody")}</p>
      <Link
        href="/dashboard"
        className="mt-8 inline-flex rounded-lg bg-navy-900 px-5 py-3 text-sm font-bold text-white transition hover:bg-navy-800"
      >
        {t("billing.backDashboard")}
      </Link>
    </div>
  );
}
