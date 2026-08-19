"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ContractorPortalDisabled } from "@/components/ContractorPortalDisabled";
import { api, ApiError } from "@/lib/api";
import { isAuthenticated, setToken } from "@/lib/auth";
import { CONTRACTOR_PORTAL_ENABLED } from "@/lib/features";
import { useI18n } from "@/lib/i18n";
import { Alert, Button, Input } from "@/components/ui";

export default function LoginPage() {
  const { t, setLanguage } = useI18n();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!CONTRACTOR_PORTAL_ENABLED) return;
    if (isAuthenticated()) router.replace("/dashboard");
  }, [router]);

  if (!CONTRACTOR_PORTAL_ENABLED) {
    return <ContractorPortalDisabled />;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const token = await api.login({ email: email.trim(), password });
      setToken(token.access_token);
      const me = await api.me();
      setLanguage(me.preferred_language);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("common.error"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-10 sm:px-6 sm:py-14">
      <h1 className="font-display text-3xl font-bold text-navy-900">
        {t("auth.loginTitle")}
      </h1>
      <p className="mt-2 text-steel-600">{t("auth.loginSubtitle")}</p>

      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        {error && <Alert>{error}</Alert>}
        <Input
          label={t("auth.email")}
          name="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />
        <Input
          label={t("auth.password")}
          name="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
        />
        <Button type="submit" loading={loading} className="w-full">
          {t("auth.signIn")}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-steel-600">
        {t("auth.noAccount")}{" "}
        <Link href="/register" className="font-semibold text-accent-600 hover:underline">
          {t("auth.createAccount")}
        </Link>
      </p>
    </div>
  );
}
