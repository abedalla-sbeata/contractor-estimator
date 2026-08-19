"use client";

import Link from "next/link";
import { use } from "react";
import { EstimateFlow } from "@/components/EstimateFlow";
import { useI18n } from "@/lib/i18n";

type PageProps = {
  params: Promise<{ contractorCode: string }>;
};

function normalizeContractorCode(raw: string): string {
  try {
    return decodeURIComponent(raw).trim().toUpperCase();
  } catch {
    return raw.trim().toUpperCase();
  }
}

export default function ClientContractorEstimatePage({ params }: PageProps) {
  const { contractorCode: raw } = use(params);
  const code = normalizeContractorCode(raw);
  const { t } = useI18n();

  if (!code || code.length < 4) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 py-16 text-center">
        <h1 className="font-display text-3xl font-bold text-navy-900">
          {t("estimate.invalidLinkTitle")}
        </h1>
        <p className="mt-3 text-steel-600">{t("estimate.invalidLinkBody")}</p>
        <Link
          href="/"
          className="mt-8 inline-flex rounded-lg bg-navy-900 px-5 py-3 text-sm font-bold text-white transition hover:bg-navy-800"
        >
          {t("common.backHome")}
        </Link>
      </div>
    );
  }

  return <EstimateFlow contractorCode={code} />;
}
