"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError, resolveMediaUrl } from "@/lib/api";
import { clearToken, isAuthenticated } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import type { Contractor, EstimateDetail } from "@/lib/types";
import { CopyButton } from "@/components/CopyButton";
import { Alert, Button, Spinner, StatusBadge } from "@/components/ui";
import {
  blockReasonKey,
  estimateStatusTone,
  formatDate,
  subscriptionTone,
} from "@/lib/status";

function normalizeContractor(me: Contractor): Contractor {
  return {
    ...me,
    receive_block_reason: me.receive_block_reason ?? null,
    can_receive_requests: Boolean(me.can_receive_requests),
  };
}

export default function DashboardPage() {
  const { t, language } = useI18n();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [contractor, setContractor] = useState<Contractor | null>(null);
  const [estimates, setEstimates] = useState<EstimateDetail[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [, startTransition] = useTransition();

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace("/login");
      return;
    }

    let cancelled = false;

    async function load() {
      setError(null);
      try {
        const [me, list] = await Promise.all([
          api.me(),
          api.listMyEstimates().catch(() => [] as EstimateDetail[]),
        ]);
        if (cancelled) return;
        startTransition(() => {
          setContractor(normalizeContractor(me));
          setEstimates(list);
          setLoading(false);
        });
      } catch (err) {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 401) return;
        startTransition(() => {
          setError(
            err instanceof ApiError
              ? err.message
              : "Something went wrong. Please try again."
          );
          setLoading(false);
        });
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [router]);

  async function onLicenseChange(fileList: FileList | null) {
    const file = fileList?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const updated = await api.uploadLicense(file);
      setContractor(normalizeContractor(updated));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("common.error"));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function startCheckout() {
    setCheckoutLoading(true);
    setError(null);
    try {
      const { checkout_url } = await api.checkout();
      window.location.assign(checkout_url);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("common.error"));
      setCheckoutLoading(false);
    }
  }

  function logout() {
    clearToken();
    router.push("/");
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-steel-600">
        <Spinner className="h-8 w-8" />
        <p>{t("dashboard.loading")}</p>
      </div>
    );
  }

  if (!contractor) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <Alert>{error ?? t("common.error")}</Alert>
        <Button className="mt-4" onClick={() => router.push("/login")}>
          {t("nav.login")}
        </Button>
      </div>
    );
  }

  const canReceive = contractor.can_receive_requests;
  const licenseUrl = resolveMediaUrl(contractor.license_image_url);
  const hasLicense = Boolean(licenseUrl);
  const isLicensePdf = Boolean(licenseUrl && /\.pdf($|\?)/i.test(licenseUrl));
  const needsSubscribe =
    contractor.subscription_status !== "active" &&
    contractor.subscription_status !== "trialing";
  const blockKey = blockReasonKey(contractor.receive_block_reason);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-navy-900">
            {t("dashboard.title")}
          </h1>
          <p className="mt-1 text-steel-600">
            {t("dashboard.welcome", { name: contractor.name })}
          </p>
        </div>
        <Button variant="ghost" onClick={logout}>
          {t("nav.logout")}
        </Button>
      </div>

      {error && (
        <div className="mt-6">
          <Alert>{error}</Alert>
        </div>
      )}

      {!canReceive && (
        <section className="mt-6 rounded-2xl border border-amber-300 bg-amber-50 px-5 py-5 sm:px-6">
          <h2 className="text-lg font-bold text-navy-900">
            {t("dashboard.subscriptionInactiveTitle")}
          </h2>
          <p className="mt-2 text-sm text-steel-700">
            {blockKey
              ? t(blockKey)
              : t("dashboard.blockReason.subscription_inactive")}
          </p>
          <Button className="mt-4" loading={checkoutLoading} onClick={startCheckout}>
            {t("dashboard.subscribe")}
          </Button>
        </section>
      )}

      <section
        className={`mt-8 rounded-2xl px-5 py-6 sm:px-8 sm:py-8 ${
          canReceive
            ? "bg-navy-900 text-white"
            : "border border-steel-200 bg-steel-100 text-navy-900"
        }`}
      >
        <p
          className={`text-sm font-medium ${
            canReceive ? "text-white/70" : "text-steel-600"
          }`}
        >
          {t("dashboard.yourCode")}
        </p>
        <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-display text-3xl font-extrabold tracking-wide sm:text-4xl">
            {contractor.public_code}
          </p>
          <CopyButton value={contractor.public_code} />
        </div>
        <p
          className={`mt-3 text-sm ${
            canReceive ? "text-white/65" : "text-steel-600"
          }`}
        >
          {canReceive ? t("dashboard.codeReady") : t("dashboard.codeNotReady")}
        </p>
      </section>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <section className="rounded-2xl border border-steel-200 bg-white p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-bold text-navy-900">
              {t("dashboard.subscription")}
            </h2>
            <StatusBadge
              label={t(`status.${contractor.subscription_status}`)}
              tone={subscriptionTone(contractor.subscription_status)}
            />
          </div>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-steel-500">{t("dashboard.trialEnds")}</dt>
              <dd className="font-medium text-navy-900">
                {formatDate(contractor.trial_ends_at, language)}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-steel-500">{t("dashboard.canReceive")}</dt>
              <dd className="font-medium text-navy-900">
                {canReceive ? t("dashboard.yes") : t("dashboard.no")}
              </dd>
            </div>
          </dl>
          {blockKey && !canReceive && (
            <p className="mt-3 text-sm text-amber-800">{t(blockKey)}</p>
          )}
          <p className="mt-4 text-xs text-steel-500">{t("dashboard.billingHint")}</p>
          <Button
            className="mt-4 w-full"
            variant={needsSubscribe ? "primary" : "secondary"}
            loading={checkoutLoading}
            onClick={startCheckout}
          >
            {checkoutLoading
              ? t("dashboard.redirectingCheckout")
              : needsSubscribe
                ? t("dashboard.subscribe")
                : t("dashboard.manageBilling")}
          </Button>
        </section>

        <section className="rounded-2xl border border-steel-200 bg-white p-5 sm:p-6">
          <h2 className="text-lg font-bold text-navy-900">
            {t("dashboard.license")}
          </h2>
          <p className="mt-2 text-sm text-steel-500">
            {t("dashboard.licenseOptionalHint")}
          </p>
          {hasLicense && licenseUrl ? (
            <div className="mt-4">
              {isLicensePdf ? (
                <a
                  href={licenseUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex rounded-lg border border-steel-200 bg-steel-50 px-4 py-3 text-sm font-semibold text-navy-900 transition hover:bg-steel-100"
                >
                  {t("dashboard.viewLicensePdf")}
                </a>
              ) : (
                <a
                  href={licenseUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block overflow-hidden rounded-xl border border-steel-200 bg-steel-50"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={licenseUrl}
                    alt=""
                    className="max-h-80 w-full object-contain p-2"
                  />
                </a>
              )}
            </div>
          ) : null}
          <div className="mt-4">
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              className="hidden"
              onChange={(e) => void onLicenseChange(e.target.files)}
            />
            <Button
              type="button"
              variant="secondary"
              loading={uploading}
              className="w-full"
              onClick={() => fileRef.current?.click()}
            >
              {uploading
                ? t("dashboard.uploading")
                : hasLicense
                  ? t("dashboard.replaceLicense")
                  : t("dashboard.uploadLicense")}
            </Button>
          </div>
        </section>
      </div>

      <section className="mt-8">
        <h2 className="font-display text-2xl font-bold text-navy-900">
          {t("dashboard.recentRequests")}
        </h2>
        {estimates.length === 0 ? (
          <p className="mt-4 rounded-2xl border border-dashed border-steel-300 bg-white px-5 py-10 text-center text-steel-500">
            {t("dashboard.emptyRequests")}
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-2xl border border-steel-200 bg-white">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-steel-200 bg-steel-50 text-steel-600">
                <tr>
                  <th className="px-4 py-3 font-semibold">{t("dashboard.client")}</th>
                  <th className="px-4 py-3 font-semibold">{t("dashboard.service")}</th>
                  <th className="px-4 py-3 font-semibold">{t("dashboard.status")}</th>
                  <th className="px-4 py-3 font-semibold">{t("dashboard.date")}</th>
                </tr>
              </thead>
              <tbody>
                {estimates.map((item) => (
                  <tr key={item.id} className="border-b border-steel-100 last:border-0">
                    <td className="px-4 py-3 font-medium text-navy-900">
                      {item.client_name}
                    </td>
                    <td className="px-4 py-3 capitalize text-steel-600">
                      {t(`estimate.${item.service_type}`)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge
                        label={t(`status.${item.status}`)}
                        tone={estimateStatusTone(item.status)}
                      />
                    </td>
                    <td className="px-4 py-3 text-steel-600">
                      {formatDate(item.created_at, language)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
