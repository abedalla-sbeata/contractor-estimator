"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { setToken } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import type { Language } from "@/lib/types";
import { Alert, Button, Input, Select } from "@/components/ui";

export default function RegisterPage() {
  const { t, language, setLanguage } = useI18n();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api.register({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password,
        preferred_language: language,
      });
      const token = await api.login({ email: email.trim(), password });
      setToken(token.access_token);
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
        {t("auth.registerTitle")}
      </h1>
      <p className="mt-2 text-steel-600">{t("auth.registerSubtitle")}</p>

      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        {error && <Alert>{error}</Alert>}
        <Input
          label={t("auth.name")}
          name="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          minLength={2}
          autoComplete="name"
        />
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
          label={t("auth.phone")}
          name="phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
          minLength={7}
          autoComplete="tel"
        />
        <Input
          label={t("auth.password")}
          name="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          hint={t("auth.passwordHint")}
          autoComplete="new-password"
        />
        <Select
          label={t("auth.preferredLanguage")}
          name="preferred_language"
          value={language}
          onChange={(e) => setLanguage(e.target.value as Language)}
        >
          <option value="en">{t("auth.english")}</option>
          <option value="es">{t("auth.spanish")}</option>
        </Select>
        <Button type="submit" loading={loading} className="w-full">
          {t("auth.createAccount")}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-steel-600">
        {t("auth.haveAccount")}{" "}
        <Link href="/login" className="font-semibold text-accent-600 hover:underline">
          {t("auth.signIn")}
        </Link>
      </p>
    </div>
  );
}
