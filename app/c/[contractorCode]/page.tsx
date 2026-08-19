"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { EstimateFlow } from "@/components/EstimateFlow";
import { api, ApiError } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { Spinner } from "@/components/ui";

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

function LinkMessage({
  title,
  body,
  homeLabel,
}: {
  title: string;
  body: string;
  homeLabel: string;
}) {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 py-16 text-center animate-fade-in">
      <h1 className="font-display text-3xl font-bold text-navy-900">{title}</h1>
      <p className="mt-3 text-steel-600">{body}</p>
      <Link
        href="/"
        className="mt-8 inline-flex rounded-lg bg-navy-900 px-5 py-3 text-sm font-bold text-white transition hover:bg-navy-800"
      >
        {homeLabel}
      </Link>
    </div>
  );
}

export default function ClientContractorEstimatePage({ params }: PageProps) {
  const { contractorCode: raw } = use(params);
  const code = normalizeContractorCode(raw);
  const { t } = useI18n();
  const [status, setStatus] = useState<"loading" | "ok" | "missing" | "blocked">(
    !code || code.length < 4 ? "missing" : "loading"
  );

  useEffect(() => {
    if (!code || code.length < 4) {
      setStatus("missing");
      return;
    }

    let cancelled = false;
    setStatus("loading");

    async function verify() {
      try {
        const contractor = await api.lookupContractor(code);
        if (cancelled) return;
        setStatus(contractor.can_receive_requests ? "ok" : "blocked");
      } catch (err) {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 404) {
          setStatus("missing");
          return;
        }
        setStatus("missing");
      }
    }

    void verify();
    return () => {
      cancelled = true;
    };
  }, [code]);

  if (status === "loading") {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 py-16">
        <Spinner className="h-8 w-8 text-navy-900" />
        <p className="mt-4 text-sm text-steel-600">{t("common.loading")}</p>
      </div>
    );
  }

  if (status === "missing") {
    return (
      <LinkMessage
        title={t("estimate.unknownLinkTitle")}
        body={t("estimate.unknownLinkBody")}
        homeLabel={t("common.backHome")}
      />
    );
  }

  if (status === "blocked") {
    return (
      <LinkMessage
        title={t("estimate.unavailableTitle")}
        body={t("estimate.blockedGeneric")}
        homeLabel={t("common.backHome")}
      />
    );
  }

  return <EstimateFlow contractorCode={code} />;
}
