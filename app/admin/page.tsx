"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Alert, Button, Input, Select, StatusBadge } from "@/components/ui";
import { API_URL } from "@/lib/api";
import type { AdminContractor, AdminStats, Language, SubscriptionStatus } from "@/lib/types";

const KEY_STORAGE = "contractor_admin_api_key";

const SUBSCRIPTION_LABELS: Record<SubscriptionStatus, string> = {
  trialing: "تجربة",
  active: "مجاني",
  past_due: "متأخر",
  canceled: "ملغي",
  expired: "منتهي",
};

const ESTIMATE_LABELS = {
  collecting: "تجميع",
  processing: "معالجة",
  sent: "انبعت",
  failed: "فشل",
} as const;

const EMPTY_FORM = {
  name: "",
  email: "",
  phone: "",
  preferred_language: "en" as Language,
};

function arabicError(message: string) {
  if (message === "Invalid admin API key") return "المفتاح غلط.";
  if (message === "Email already registered") return "الإيميل هاد مسجّل قبل هيك.";
  if (message === "Admin API is not configured (set ADMIN_API_KEY).") {
    return "الـ API لسه ما عليه مفتاح أدمن.";
  }
  return message;
}

function messageFromDetail(detail: unknown) {
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((item) =>
        item && typeof item === "object" && "msg" in item ? String(item.msg) : "تأكد من البيانات",
      )
      .join("، ");
  }
  return "الطلب ما نجح";
}

async function adminFetch<T>(path: string, key: string, options: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        "X-Admin-API-Key": key,
        ...(options.headers ?? {}),
      },
    });
  } catch {
    throw new Error("ما قدرت أوصل للـ API.");
  }

  const data = (await response.json().catch(() => ({}))) as { detail?: unknown };
  if (!response.ok) {
    const error = new Error(arabicError(messageFromDetail(data.detail))) as Error & { status?: number };
    error.status = response.status;
    throw error;
  }
  return data as T;
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("ar", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function share(count: number, total: number) {
  if (!count || !total) return 0;
  return Math.max(4, Math.round((count / total) * 100));
}

function subscriptionTone(status: SubscriptionStatus) {
  if (status === "active" || status === "trialing") return "success" as const;
  if (status === "past_due" || status === "expired") return "warning" as const;
  return "danger" as const;
}

export default function AdminPage() {
  const [apiKey, setApiKey] = useState("");
  const [keyInput, setKeyInput] = useState("");
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [contractors, setContractors] = useState<AdminContractor[]>([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [created, setCreated] = useState<AdminContractor | null>(null);
  const [query, setQuery] = useState("");
  const [copiedCode, setCopiedCode] = useState("");

  async function loadDashboard(key: string) {
    setLoading(true);
    setError("");
    try {
      const [nextStats, nextContractors] = await Promise.all([
        adminFetch<AdminStats>("/api/admin/stats", key),
        adminFetch<AdminContractor[]>("/api/admin/contractors", key),
      ]);
      setStats(nextStats);
      setContractors(nextContractors);
    } catch (err) {
      const failure = err as Error & { status?: number };
      if (failure.status === 401) {
        window.sessionStorage.removeItem(KEY_STORAGE);
        setApiKey("");
      }
      setError(failure.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const saved = window.sessionStorage.getItem(KEY_STORAGE) ?? "";
    setApiKey(saved);
    setKeyInput(saved);
    setReady(true);
    if (saved) {
      void loadDashboard(saved);
    }
  }, []);

  const visibleContractors = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return contractors;
    return contractors.filter((contractor) =>
      [contractor.name, contractor.email, contractor.public_code, contractor.phone]
        .join(" ")
        .toLowerCase()
        .includes(needle),
    );
  }, [contractors, query]);

  function saveKey(event: FormEvent) {
    event.preventDefault();
    const nextKey = keyInput.trim();
    if (!nextKey) {
      setError("حط مفتاح الأدمن أول.");
      return;
    }
    window.sessionStorage.setItem(KEY_STORAGE, nextKey);
    setApiKey(nextKey);
    void loadDashboard(nextKey);
  }

  function forgetKey() {
    window.sessionStorage.removeItem(KEY_STORAGE);
    setApiKey("");
    setKeyInput("");
    setStats(null);
    setContractors([]);
    setCreated(null);
    setError("");
  }

  async function createContractor(event: FormEvent) {
    event.preventDefault();
    const name = form.name.trim();
    const email = form.email.trim();
    const phone = form.phone.trim();
    if (name.length < 2) {
      setError("الاسم لازم يكون حرفين على الأقل.");
      return;
    }
    if (!email.includes("@")) {
      setError("حط إيميل صحيح.");
      return;
    }
    if (phone && phone.length < 7) {
      setError("إذا حطيت تلفون، خلّيه ٧ أرقام على الأقل.");
      return;
    }

    setCreating(true);
    setError("");
    try {
      const contractor = await adminFetch<AdminContractor>("/api/admin/contractors", apiKey, {
        method: "POST",
        body: JSON.stringify({
          name,
          email,
          phone,
          preferred_language: form.preferred_language,
        }),
      });
      setCreated(contractor);
      setForm(EMPTY_FORM);
      await loadDashboard(apiKey);
    } catch (err) {
      setError(err instanceof Error ? err.message : "الطلب ما نجح");
    } finally {
      setCreating(false);
    }
  }

  async function copyLink(contractor: AdminContractor) {
    try {
      await navigator.clipboard.writeText(contractor.client_link);
      setCopiedCode(contractor.public_code);
    } catch {
      setError("المتصفح ما سمح بالنسخ. انسخ الرابط يدوي.");
    }
  }

  if (!ready) {
    return <p className="px-4 py-16 text-center text-steel-600">عم بحمّل...</p>;
  }

  if (!apiKey) {
    return (
      <section className="mx-auto flex min-h-[70vh] max-w-md items-center px-4 py-16" dir="rtl" lang="ar">
        <form onSubmit={saveKey} className="w-full space-y-4 rounded-2xl border border-steel-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold text-accent-600">/admin</p>
          <h1 className="font-display text-3xl font-bold text-navy-900">لوحة الإدارة</h1>
          <p className="text-sm text-steel-600">حط مفتاح الأدمن عشان تشوف الكونتراكتورز والإحصائيات.</p>
          {error ? <Alert>{error}</Alert> : null}
          <Input
            label="مفتاح الأدمن"
            type="password"
            value={keyInput}
            onChange={(event) => setKeyInput(event.target.value)}
            autoComplete="current-password"
            placeholder="X-Admin-API-Key"
          />
          <Button type="submit" className="w-full">
            دخول
          </Button>
        </form>
      </section>
    );
  }

  const statCards = [
    ["الكونتراكتورز", stats?.contractors_total],
    ["يستقبلوا طلبات", stats?.contractors_can_receive],
    ["جدد خلال ٧ أيام", stats?.contractors_new_7d],
    ["التقديرات", stats?.estimates_total],
    ["تقديرات ٧ أيام", stats?.estimates_7d],
    ["تقديرات ٣٠ يوم", stats?.estimates_30d],
  ] as const;

  return (
    <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6" dir="rtl" lang="ar">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-accent-600">/admin</p>
          <h1 className="font-display text-3xl font-bold text-navy-900">الكونتراكتورز والإحصائيات</h1>
        </div>
        <div className="flex gap-2">
          <Button type="button" onClick={() => void loadDashboard(apiKey)} loading={loading}>
            حدّث
          </Button>
          <Button type="button" variant="ghost" onClick={forgetKey}>
            غيّر المفتاح
          </Button>
        </div>
      </div>

      {error ? (
        <div className="mt-4">
          <Alert>{error}</Alert>
        </div>
      ) : null}

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {statCards.map(([label, value]) => (
          <article key={label} className="rounded-2xl border border-steel-200 bg-white px-4 py-4 shadow-sm">
            <p className="text-sm text-steel-600">{label}</p>
            <p className="mt-2 font-display text-3xl font-bold text-navy-900">{value ?? "—"}</p>
          </article>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[320px_1fr]">
        <form
          onSubmit={createContractor}
          className="space-y-4 rounded-2xl border border-steel-200 bg-white p-5 shadow-sm"
        >
          <h2 className="font-display text-xl font-bold text-navy-900">أضف كونتراكتور</h2>
          <Input label="الاسم" name="name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="اسم الشركة" />
          <Input label="الإيميل" name="email" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="owner@company.com" />
          <Input label="التلفون" name="phone" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} placeholder="اختياري" />
          <Select
            label="اللغة"
            name="preferred_language"
            value={form.preferred_language}
            onChange={(event) =>
              setForm({ ...form, preferred_language: event.target.value as Language })
            }
          >
            <option value="en">إنجليزي</option>
            <option value="es">إسباني</option>
          </Select>
          <Button type="submit" loading={creating} className="w-full">
            أضف الكونتراكتور
          </Button>
        </form>

        <div className="space-y-6 rounded-2xl border border-steel-200 bg-white p-5 shadow-sm">
          <div>
            <h2 className="font-display text-xl font-bold text-navy-900">توزيع الحسابات</h2>
            <div className="mt-4 space-y-3">
              {(Object.keys(SUBSCRIPTION_LABELS) as SubscriptionStatus[]).map((key) => {
                const count = stats?.contractors_by_subscription?.[key] ?? 0;
                return (
                  <div key={key} className="grid grid-cols-[72px_1fr_28px] items-center gap-2 text-sm">
                    <span>{SUBSCRIPTION_LABELS[key]}</span>
                    <div className="h-2 overflow-hidden rounded-full bg-steel-100">
                      <div className="h-full bg-accent-500" style={{ width: `${share(count, stats?.contractors_total ?? 0)}%` }} />
                    </div>
                    <strong>{count}</strong>
                  </div>
                );
              })}
            </div>
          </div>
          <div>
            <h2 className="font-display text-xl font-bold text-navy-900">حالة التقديرات</h2>
            <div className="mt-4 space-y-3">
              {(Object.keys(ESTIMATE_LABELS) as (keyof typeof ESTIMATE_LABELS)[]).map((key) => {
                const count = stats?.estimates_by_status?.[key] ?? 0;
                return (
                  <div key={key} className="grid grid-cols-[72px_1fr_28px] items-center gap-2 text-sm">
                    <span>{ESTIMATE_LABELS[key]}</span>
                    <div className="h-2 overflow-hidden rounded-full bg-steel-100">
                      <div className="h-full bg-navy-900" style={{ width: `${share(count, stats?.estimates_total ?? 0)}%` }} />
                    </div>
                    <strong>{count}</strong>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {created ? (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          <div>
            <strong>انضاف {created.name}.</strong>
            <p dir="ltr" className="mt-1 text-left">
              {created.public_code} · {created.client_link}
            </p>
          </div>
          <Button type="button" variant="secondary" onClick={() => void copyLink(created)}>
            {copiedCode === created.public_code ? "تم النسخ" : "انسخ رابط العميل"}
          </Button>
        </div>
      ) : null}

      <div className="mt-8 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-bold text-navy-900">كل الكونتراكتورز</h2>
          <p className="text-sm text-steel-600">{visibleContractors.length} ظاهرين</p>
        </div>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="دوّر بالاسم أو الإيميل أو الكود"
          className="w-full max-w-xs rounded-lg border border-steel-200 bg-white px-3.5 py-2.5 text-sm"
        />
      </div>

      {visibleContractors.length === 0 ? (
        <p className="mt-4 rounded-2xl border border-dashed border-steel-300 bg-white px-4 py-6 text-sm text-steel-600">
          {contractors.length === 0 ? "لسه ما في كونتراكتورز. ضيف أول واحد من الفورم." : "ما لقيت حدا بهالكلمة."}
        </p>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-2xl border border-steel-200 bg-white shadow-sm">
          <table className="w-full min-w-[720px] text-right text-sm">
            <thead className="text-steel-600">
              <tr>
                <th className="px-4 py-3 font-semibold">الاسم</th>
                <th className="px-4 py-3 font-semibold">الكود</th>
                <th className="px-4 py-3 font-semibold">الاشتراك</th>
                <th className="px-4 py-3 font-semibold">الطلبات</th>
                <th className="px-4 py-3 font-semibold">يستقبل</th>
                <th className="px-4 py-3 font-semibold">انضاف</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {visibleContractors.map((contractor) => (
                <tr key={contractor.id} className="border-t border-steel-100">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-navy-900">{contractor.name}</div>
                    <div className="text-steel-500">{contractor.email}</div>
                  </td>
                  <td className="px-4 py-3" dir="ltr">
                    {contractor.public_code}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge
                      label={SUBSCRIPTION_LABELS[contractor.subscription_status]}
                      tone={subscriptionTone(contractor.subscription_status)}
                    />
                  </td>
                  <td className="px-4 py-3">{contractor.estimate_count}</td>
                  <td className="px-4 py-3">{contractor.can_receive_requests ? "نعم" : "لا"}</td>
                  <td className="px-4 py-3">{formatDate(contractor.created_at)}</td>
                  <td className="px-4 py-3">
                    <Button type="button" variant="ghost" onClick={() => void copyLink(contractor)}>
                      {copiedCode === contractor.public_code ? "تم النسخ" : "انسخ الرابط"}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
