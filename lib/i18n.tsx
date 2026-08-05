"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import en from "@/messages/en.json";
import es from "@/messages/es.json";
import type { Language } from "@/lib/types";

const LANG_KEY = "ce_language";
const LANG_EVENT = "ce-language-change";

type Messages = typeof en;

const catalogs: Record<Language, Messages> = { en, es };

type I18nContextValue = {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (path: string, vars?: Record<string, string | number>) => string;
  messages: Messages;
};

const I18nContext = createContext<I18nContextValue | null>(null);

function getByPath(obj: unknown, path: string): string | undefined {
  const parts = path.split(".");
  let current: unknown = obj;
  for (const part of parts) {
    if (current == null || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return typeof current === "string" ? current : undefined;
}

function readLanguage(): Language {
  try {
    const stored = localStorage.getItem(LANG_KEY);
    if (stored === "en" || stored === "es") return stored;
  } catch {
    /* ignore */
  }
  const nav = navigator.language?.toLowerCase() ?? "en";
  if (nav.startsWith("es")) return "es";
  return "en";
}

function subscribeLanguage(onStoreChange: () => void) {
  const handler = () => onStoreChange();
  window.addEventListener(LANG_EVENT, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(LANG_EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}

function applyDocumentLang(lang: Language) {
  if (typeof document === "undefined") return;
  document.documentElement.lang = lang === "es" ? "es-MX" : "en";
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const language = useSyncExternalStore(
    subscribeLanguage,
    readLanguage,
    () => "en" as Language
  );

  useEffect(() => {
    applyDocumentLang(language);
  }, [language]);

  const setLanguage = useCallback((lang: Language) => {
    try {
      localStorage.setItem(LANG_KEY, lang);
    } catch {
      /* ignore */
    }
    applyDocumentLang(lang);
    window.dispatchEvent(new Event(LANG_EVENT));
  }, []);

  const messages = catalogs[language];

  const t = useCallback(
    (path: string, vars?: Record<string, string | number>) => {
      let value = getByPath(messages, path) ?? getByPath(en, path) ?? path;
      if (vars) {
        Object.entries(vars).forEach(([key, val]) => {
          value = value.replace(`{${key}}`, String(val));
        });
      }
      return value;
    },
    [messages]
  );

  const value = useMemo(
    () => ({ language, setLanguage, t, messages }),
    [language, setLanguage, t, messages]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
