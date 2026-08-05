import { clearToken, getToken } from "@/lib/auth";
import type {
  ApiErrorBody,
  ApiErrorDetailObject,
  CheckoutResponse,
  Contractor,
  ContractorLoginInput,
  ContractorRegisterInput,
  Estimate,
  EstimateDetail,
  EstimateStartInput,
  TokenResponse,
} from "@/lib/types";

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  "https://api-production-6fdd.up.railway.app";

/** Resolve relative media paths from the API to absolute URLs. */
export function resolveMediaUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (/^https?:\/\//i.test(url) || url.startsWith("data:")) return url;
  const base = API_URL.replace(/\/$/, "");
  const path = url.startsWith("/") ? url : `/${url}`;
  return `${base}${path}`;
}

export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

function parseError(body: ApiErrorBody | null): { message: string; code?: string } {
  if (!body?.detail) {
    return { message: "Something went wrong. Please try again." };
  }

  const { detail } = body;

  if (typeof detail === "string") {
    return { message: detail };
  }

  if (Array.isArray(detail)) {
    return {
      message: detail
        .map((item) => item.msg ?? item.message)
        .filter(Boolean)
        .join(". "),
    };
  }

  const obj = detail as ApiErrorDetailObject;
  return {
    message: obj.message ?? obj.msg ?? "Something went wrong. Please try again.",
    code: obj.code,
  };
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  auth = false
): Promise<T> {
  const headers = new Headers(options.headers);

  if (!(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (auth) {
    const token = getToken();
    if (!token) {
      throw new ApiError("Not authenticated", 401);
    }
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  if (response.status === 401 && auth) {
    clearToken();
    if (typeof window !== "undefined") {
      // Hard navigation ensures protected client state is fully reset.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- intentional full reset on auth failure
      window.location.assign("/login");
    }
    throw new ApiError("Session expired. Please sign in again.", 401);
  }

  if (!response.ok) {
    let body: ApiErrorBody | null = null;
    try {
      body = (await response.json()) as ApiErrorBody;
    } catch {
      body = null;
    }
    const parsed = parseError(body);
    throw new ApiError(parsed.message, response.status, parsed.code);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export const api = {
  register(data: ContractorRegisterInput) {
    return request<Contractor>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  login(data: ContractorLoginInput) {
    return request<TokenResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  me() {
    return request<Contractor>("/api/auth/me", { method: "GET" }, true);
  },

  uploadLicense(file: File) {
    const form = new FormData();
    form.append("file", file);
    return request<Contractor>(
      "/api/auth/me/license",
      { method: "POST", body: form },
      true
    );
  },

  checkout() {
    return request<CheckoutResponse>(
      "/api/billing/checkout",
      { method: "POST" },
      true
    );
  },

  startEstimate(data: EstimateStartInput) {
    return request<Estimate>("/api/estimates/start", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  sendMessage(id: string, message: string) {
    return request<Estimate>(`/api/estimates/${id}/message`, {
      method: "POST",
      body: JSON.stringify({ message }),
    });
  },

  uploadImages(id: string, files: File[]) {
    const form = new FormData();
    files.forEach((file) => form.append("files", file));
    return request<Estimate>(`/api/estimates/${id}/images`, {
      method: "POST",
      body: form,
    });
  },

  getEstimate(id: string) {
    return request<Estimate>(`/api/estimates/${id}`, { method: "GET" });
  },

  listMyEstimates() {
    return request<EstimateDetail[]>(
      "/api/estimates/mine/list",
      { method: "GET" },
      true
    );
  },
};
