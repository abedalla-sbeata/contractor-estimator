export type Language = "en" | "es";
export type ServiceType = "painting" | "roofing" | "flooring";
export type EstimateStatus = "collecting" | "processing" | "sent" | "failed";
export type SubscriptionStatus =
  | "trialing"
  | "active"
  | "past_due"
  | "canceled"
  | "expired";

/** Present on API responses; approval workflow is unused — ignore for gating. */
export type LicenseStatus = "none" | "pending" | "approved" | "rejected";

export type ReceiveBlockReason = "subscription_inactive" | string;

export interface Contractor {
  id: string;
  public_code: string;
  name: string;
  email: string;
  phone: string;
  license_image_url: string | null;
  license_status?: LicenseStatus | null;
  preferred_language: Language;
  trial_ends_at: string;
  subscription_status: SubscriptionStatus;
  can_receive_requests: boolean;
  receive_block_reason: ReceiveBlockReason | null;
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export interface ContractorRegisterInput {
  name: string;
  email: string;
  phone: string;
  password: string;
  preferred_language: Language;
}

export interface ContractorLoginInput {
  email: string;
  password: string;
}

export interface EstimateStartInput {
  contractor_code: string;
  client_name: string;
  client_email: string;
  client_language: Language;
  location_text: string;
  state?: string | null;
  service_type: ServiceType;
  description: string;
}

export interface Estimate {
  id: string;
  status: EstimateStatus;
  service_type: ServiceType;
  client_language: Language;
  location_text: string;
  assistant_message: string | null;
  image_urls: string[];
  is_complete: boolean;
  created_at: string;
}

export interface EstimateDetail {
  id: string;
  status: EstimateStatus;
  service_type: ServiceType;
  client_name: string;
  client_email: string;
  client_language: Language;
  location_text: string;
  state: string | null;
  description: string;
  chat_history: Record<string, unknown>[];
  image_urls: string[];
  report_json: Record<string, unknown> | null;
  report_docx_url: string | null;
  emailed_at: string | null;
  created_at: string;
}

export interface CheckoutResponse {
  checkout_url: string;
}

export interface ApiErrorDetailObject {
  code?: string;
  message?: string;
  msg?: string;
  loc?: unknown[];
}

export interface ApiErrorBody {
  detail?: string | ApiErrorDetailObject | ApiErrorDetailObject[];
}
