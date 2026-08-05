"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { api, ApiError } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import type { Estimate, ServiceType } from "@/lib/types";
import { US_STATES } from "@/lib/us-states";
import { Alert, Button, Input, Select, Textarea } from "@/components/ui";

type ChatItem = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  imagePreviews?: string[];
};

type PendingFile = {
  id: string;
  file: File;
  previewUrl: string;
};

type Step = "form" | "chat" | "success" | "failed";

export default function EstimatePage() {
  const { t, language } = useI18n();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>("form");
  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [messages, setMessages] = useState<ChatItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [draft, setDraft] = useState("");
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);

  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [contractorCode, setContractorCode] = useState("");
  const [locationText, setLocationText] = useState("");
  const [state, setState] = useState("");
  const [serviceType, setServiceType] = useState<ServiceType>("painting");
  const [description, setDescription] = useState("");

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, step, pendingFiles.length, thinking]);

  useEffect(() => {
    return () => {
      pendingFiles.forEach((item) => URL.revokeObjectURL(item.previewUrl));
    };
    // Only revoke on unmount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!estimate || step !== "chat") return;
    if (estimate.status === "processing") {
      const timer = setInterval(async () => {
        try {
          const next = await api.getEstimate(estimate.id);
          setEstimate(next);
          if (next.is_complete || next.status === "sent") {
            setStep("success");
          } else if (next.status === "failed") {
            setStep("failed");
          }
        } catch {
          /* keep polling quietly */
        }
      }, 2500);
      return () => clearInterval(timer);
    }
  }, [estimate, step]);

  function finishWithEstimate(next: Estimate, appendAssistant = true) {
    setEstimate(next);
    if (appendAssistant && next.assistant_message) {
      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}-${Math.random()}`,
          role: "assistant",
          content: next.assistant_message as string,
        },
      ]);
    }

    if (next.is_complete || next.status === "sent") {
      setStep("success");
    } else if (next.status === "failed") {
      setStep("failed");
    } else {
      setStep("chat");
    }
  }

  function applyEstimateResult(
    next: Estimate,
    userText?: string,
    imagePreviews?: string[]
  ) {
    setEstimate(next);
    setMessages((prev) => {
      const extras: ChatItem[] = [];
      if (userText || (imagePreviews && imagePreviews.length > 0)) {
        extras.push({
          id: `u-${Date.now()}`,
          role: "user",
          content: userText ?? "",
          imagePreviews,
        });
      }
      if (next.assistant_message) {
        extras.push({
          id: `a-${Date.now()}-${Math.random()}`,
          role: "assistant",
          content: next.assistant_message,
        });
      }
      return [...prev, ...extras];
    });

    if (next.is_complete || next.status === "sent") {
      setStep("success");
    } else if (next.status === "failed") {
      setStep("failed");
    } else {
      setStep("chat");
    }
  }

  function addPendingFiles(files: FileList | null) {
    if (!files?.length) return;
    const next = Array.from(files)
      .filter((file) => file.type.startsWith("image/"))
      .map((file) => ({
        id: `${file.name}-${file.size}-${file.lastModified}-${Math.random()}`,
        file,
        previewUrl: URL.createObjectURL(file),
      }));
    if (next.length) {
      setPendingFiles((prev) => [...prev, ...next]);
    }
    if (fileRef.current) fileRef.current.value = "";
  }

  function removePendingFile(id: string) {
    setPendingFiles((prev) => {
      const target = prev.find((item) => item.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((item) => item.id !== id);
    });
  }

  async function onStart(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await api.startEstimate({
        contractor_code: contractorCode.trim().toUpperCase(),
        client_name: clientName.trim(),
        client_email: clientEmail.trim(),
        client_language: language,
        location_text: locationText.trim(),
        state: state || null,
        service_type: serviceType,
        description: description.trim(),
      });
      setMessages([]);
      applyEstimateResult(result);
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) {
        setError(t("estimate.blockedGeneric"));
      } else {
        setError(err instanceof ApiError ? err.message : t("common.error"));
      }
    } finally {
      setLoading(false);
    }
  }

  async function onSend(e: FormEvent) {
    e.preventDefault();
    if (!estimate || thinking) return;

    const text = draft.trim();
    const files = pendingFiles.map((item) => item.file);
    const previews = pendingFiles.map((item) => item.previewUrl);
    if (!text && files.length === 0) return;

    const userContent =
      text || t("estimate.photosAdded", { count: files.length });
    const userMessageId = `u-${Date.now()}`;

    setDraft("");
    setPendingFiles([]);
    setThinking(true);
    setError(null);
    setMessages((prev) => [
      ...prev,
      {
        id: userMessageId,
        role: "user",
        content: userContent,
        imagePreviews: previews.length > 0 ? previews : undefined,
      },
    ]);

    try {
      let latest = estimate;

      if (files.length > 0) {
        latest = await api.uploadImages(estimate.id, files);
      }
      if (text) {
        latest = await api.sendMessage(estimate.id, text);
      }

      finishWithEstimate(latest, true);
    } catch (err) {
      setMessages((prev) => prev.filter((msg) => msg.id !== userMessageId));
      setDraft(text);
      setPendingFiles(
        files.map((file, index) => ({
          id: `${file.name}-${index}-${Date.now()}`,
          file,
          previewUrl: previews[index] ?? URL.createObjectURL(file),
        }))
      );
      setError(err instanceof ApiError ? err.message : t("common.error"));
    } finally {
      setThinking(false);
    }
  }

  function reset() {
    pendingFiles.forEach((item) => URL.revokeObjectURL(item.previewUrl));
    setPendingFiles([]);
    setStep("form");
    setEstimate(null);
    setMessages([]);
    setError(null);
    setDraft("");
    setThinking(false);
  }

  if (step === "success") {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 py-16 text-center animate-fade-in">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-2xl text-emerald-700">
          ✓
        </div>
        <h1 className="mt-6 font-display text-3xl font-bold text-navy-900">
          {t("estimate.successTitle")}
        </h1>
        <p className="mt-3 text-lg text-steel-600">{t("estimate.successBody")}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-lg bg-navy-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-navy-800"
          >
            {t("common.backHome")}
          </Link>
          <Button variant="ghost" onClick={reset}>
            {t("estimate.retry")}
          </Button>
        </div>
      </div>
    );
  }

  if (step === "failed") {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 py-16 text-center">
        <h1 className="font-display text-3xl font-bold text-navy-900">
          {t("estimate.failedTitle")}
        </h1>
        <p className="mt-3 text-steel-600">{t("estimate.failedBody")}</p>
        <Button className="mt-8" onClick={reset}>
          {t("estimate.retry")}
        </Button>
      </div>
    );
  }

  if (step === "chat" && estimate) {
    const processing = estimate.status === "processing";
    const canSend = Boolean(draft.trim() || pendingFiles.length > 0);

    return (
      <div className="mx-auto flex h-[calc(100vh-8rem)] max-w-3xl flex-col px-4 py-4 sm:px-6 sm:py-6">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h1 className="font-display text-xl font-bold text-navy-900 sm:text-2xl">
            {t("estimate.chatTitle")}
          </h1>
          <span className="text-xs font-semibold uppercase tracking-wide text-steel-500">
            {t(`status.${estimate.status}`)}
          </span>
        </div>

        {error && (
          <div className="mb-3">
            <Alert>{error}</Alert>
          </div>
        )}

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-steel-200 bg-white shadow-sm">
          <div className="flex-1 space-y-3 overflow-y-auto p-4 sm:p-5">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-navy-900 text-white"
                      : "bg-steel-100 text-navy-900"
                  }`}
                >
                  <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide opacity-70">
                    {msg.role === "user" ? t("estimate.you") : t("estimate.assistant")}
                  </p>
                  {msg.imagePreviews && msg.imagePreviews.length > 0 && (
                    <div className="mb-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {msg.imagePreviews.map((src) => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          key={src}
                          src={src}
                          alt=""
                          className="h-20 w-full rounded-lg object-cover"
                        />
                      ))}
                    </div>
                  )}
                  {msg.content ? (
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  ) : null}
                </div>
              </div>
            ))}
            {(thinking || processing) && (
              <div className="flex justify-start">
                <div className="max-w-[85%] rounded-2xl bg-steel-100 px-4 py-3 text-sm text-navy-900">
                  <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide opacity-70">
                    {t("estimate.assistant")}
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="flex gap-1" aria-hidden>
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-steel-500 [animation-delay:-0.2s]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-steel-500 [animation-delay:-0.1s]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-steel-500" />
                    </span>
                    <span className="text-steel-600">
                      {processing ? t("estimate.processing") : t("estimate.thinking")}
                    </span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {!processing && (
            <form
              onSubmit={onSend}
              className="border-t border-steel-200 bg-white p-3 sm:p-4"
            >
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                className="hidden"
                onChange={(e) => addPendingFiles(e.target.files)}
              />

              {pendingFiles.length > 0 && (
                <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
                  {pendingFiles.map((item) => (
                    <div
                      key={item.id}
                      className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-steel-200 bg-steel-50"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.previewUrl}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removePendingFile(item.id)}
                        disabled={thinking}
                        className="absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-navy-900/80 text-xs text-white disabled:opacity-50"
                        aria-label={t("estimate.removePhoto")}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-end gap-2 rounded-2xl border border-steel-200 bg-steel-50 px-2 py-2 focus-within:border-accent-500 focus-within:ring-2 focus-within:ring-accent-500/20">
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={thinking}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-steel-600 transition hover:bg-white hover:text-navy-900 disabled:opacity-50"
                  aria-label={t("estimate.uploadPhotos")}
                  title={t("estimate.uploadPhotos")}
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    aria-hidden
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4 16l4.6-4.6a2 2 0 012.8 0L18 18M14 14l1.6-1.6a2 2 0 012.8 0L20 14M8 8h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </button>

                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      if (canSend && !thinking) {
                        e.currentTarget.form?.requestSubmit();
                      }
                    }
                  }}
                  placeholder={t("estimate.chatPlaceholder")}
                  rows={1}
                  disabled={thinking}
                  className="max-h-32 min-h-[2.5rem] min-w-0 flex-1 resize-none bg-transparent px-1 py-2 text-sm text-navy-900 placeholder:text-steel-400 focus:outline-none disabled:opacity-60"
                />

                <Button
                  type="submit"
                  disabled={!canSend || thinking}
                  className="shrink-0 rounded-xl"
                >
                  {t("estimate.send")}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-8 sm:px-6 sm:py-12">
      <h1 className="font-display text-3xl font-bold text-navy-900">
        {t("estimate.title")}
      </h1>
      <p className="mt-2 text-steel-600">{t("estimate.subtitle")}</p>

      <form onSubmit={onStart} className="mt-8 space-y-4">
        {error && <Alert>{error}</Alert>}
        <Input
          label={t("estimate.clientName")}
          name="client_name"
          value={clientName}
          onChange={(e) => setClientName(e.target.value)}
          required
          minLength={2}
          autoComplete="name"
        />
        <Input
          label={t("estimate.clientEmail")}
          name="client_email"
          type="email"
          value={clientEmail}
          onChange={(e) => setClientEmail(e.target.value)}
          required
          autoComplete="email"
        />
        <Input
          label={t("estimate.contractorCode")}
          name="contractor_code"
          value={contractorCode}
          onChange={(e) => setContractorCode(e.target.value)}
          required
          minLength={4}
          hint={t("estimate.contractorCodeHint")}
          placeholder="CTR-XXXXX"
          className="uppercase tracking-wide"
        />
        <Input
          label={t("estimate.location")}
          name="location_text"
          value={locationText}
          onChange={(e) => setLocationText(e.target.value)}
          required
          minLength={2}
          hint={t("estimate.locationHint")}
        />
        <Select
          label={t("estimate.state")}
          name="state"
          value={state}
          onChange={(e) => setState(e.target.value)}
        >
          <option value="">{t("estimate.statePlaceholder")}</option>
          {US_STATES.map((s) => (
            <option key={s.code} value={s.code}>
              {s.code} — {s.name}
            </option>
          ))}
        </Select>
        <Select
          label={t("estimate.serviceType")}
          name="service_type"
          value={serviceType}
          onChange={(e) => setServiceType(e.target.value as ServiceType)}
          required
        >
          <option value="painting">{t("estimate.painting")}</option>
          <option value="roofing">{t("estimate.roofing")}</option>
          <option value="flooring">{t("estimate.flooring")}</option>
        </Select>
        <Textarea
          label={t("estimate.description")}
          name="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          minLength={5}
          rows={4}
          hint={t("estimate.descriptionHint")}
        />
        <Button type="submit" loading={loading} className="w-full">
          {t("estimate.startChat")}
        </Button>
      </form>
    </div>
  );
}
