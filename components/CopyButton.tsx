"use client";

import { useState } from "react";
import { Button } from "@/components/ui";
import { useI18n } from "@/lib/i18n";

export function CopyButton({ value }: { value: string }) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* ignore */
    }
  }

  return (
    <Button type="button" variant="secondary" onClick={copy} className="shrink-0">
      {copied ? t("dashboard.copied") : t("dashboard.copy")}
    </Button>
  );
}
