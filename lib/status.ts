import type {
  EstimateStatus,
  ReceiveBlockReason,
  SubscriptionStatus,
} from "@/lib/types";

export function estimateStatusTone(
  status: EstimateStatus
): "neutral" | "success" | "warning" | "danger" | "info" {
  switch (status) {
    case "sent":
      return "success";
    case "processing":
      return "info";
    case "failed":
      return "danger";
    default:
      return "warning";
  }
}

export function subscriptionTone(
  status: SubscriptionStatus
): "neutral" | "success" | "warning" | "danger" | "info" {
  switch (status) {
    case "active":
      return "success";
    case "trialing":
      return "info";
    case "past_due":
      return "warning";
    case "canceled":
    case "expired":
      return "danger";
    default:
      return "neutral";
  }
}

export function blockReasonKey(
  reason: ReceiveBlockReason | null | undefined
): string | null {
  if (!reason) return null;
  if (reason === "subscription_inactive") {
    return "dashboard.blockReason.subscription_inactive";
  }
  return "dashboard.blockReason.subscription_inactive";
}

export function formatDate(value: string, language: "en" | "es") {
  try {
    return new Intl.DateTimeFormat(language === "es" ? "es-MX" : "en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
}
