import type {
  AddressInput,
  CardInput,
  CheckoutInput,
  LoginInput,
  PetInput,
  ProfileInput,
  RegisterInput,
  SubscriptionAction,
  SubscriptionItemsInput,
  SubscriptionUpdateInput,
} from "./schemas";
import type {
  Address,
  AuthResult,
  CartLine,
  CheckoutResult,
  Order,
  PaymentMethod,
  Pet,
  Product,
  ProductListParams,
  QuoteResponse,
  Subscription,
  User,
} from "./types";

export class ApiError extends Error {
  status: number;
  code: string;
  /** Alan adı -> hata mesajı (form doğrulama hataları) */
  fields: Record<string, string>;

  constructor(status: number, code: string, message: string, fields: Record<string, string> = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.fields = fields;
  }
}

export interface ApiClientOptions {
  /** Örn. "https://patipaket.com" — web'de aynı origin için "" verilir. */
  baseUrl: string;
  /** Mobil: Bearer token kaynağı. */
  getToken?: () => string | null | undefined;
  /** Web: oturum httpOnly çerezde tutulur. */
  useCookies?: boolean;
  onUnauthorized?: () => void;
  fetchImpl?: typeof fetch;
}

type Query = Record<string, string | number | boolean | undefined | null>;

function toQueryString(query?: Query): string {
  if (!query) return "";
  const parts: string[] = [];
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === "") continue;
    parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
  }
  return parts.length ? `?${parts.join("&")}` : "";
}

export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  return "Bağlantı kurulamadı. İnternet bağlantınızı kontrol edip tekrar deneyin.";
}

export function createApiClient(options: ApiClientOptions) {
  const base = `${options.baseUrl.replace(/\/$/, "")}/api/v1`;

  async function request<T>(method: string, path: string, body?: unknown, query?: Query): Promise<T> {
    const headers: Record<string, string> = { Accept: "application/json" };
    if (body !== undefined) headers["Content-Type"] = "application/json";
    const token = options.getToken?.();
    if (token) headers.Authorization = `Bearer ${token}`;
    if (options.useCookies) headers["X-Session-Mode"] = "cookie";

    const doFetch = options.fetchImpl ?? fetch;
    const response = await doFetch(`${base}${path}${toQueryString(query)}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      credentials: options.useCookies ? "same-origin" : "omit",
    });

    let payload: unknown = null;
    const text = await response.text();
    if (text) {
      try {
        payload = JSON.parse(text);
      } catch {
        payload = null;
      }
    }

    if (!response.ok) {
      const err = (payload as { error?: { code?: string; message?: string; fields?: Record<string, string> } } | null)
        ?.error;
      if (response.status === 401) options.onUnauthorized?.();
      throw new ApiError(
        response.status,
        err?.code ?? "unknown",
        err?.message ?? "Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.",
        err?.fields ?? {},
      );
    }
    return payload as T;
  }

  return {
    config: () => request<{ paymentTestMode: boolean }>("GET", "/config"),
    auth: {
      register: (input: RegisterInput) => request<AuthResult>("POST", "/auth/register", input),
      login: (input: LoginInput) => request<AuthResult>("POST", "/auth/login", input),
      logout: () => request<{ ok: true }>("POST", "/auth/logout"),
      me: () => request<{ user: User }>("GET", "/auth/me"),
      updateProfile: (input: ProfileInput) => request<{ user: User }>("PATCH", "/auth/me", input),
    },
    products: {
      list: (params: ProductListParams = {}) =>
        request<{ products: Product[] }>("GET", "/products", undefined, { ...params }),
      get: (slug: string) => request<{ product: Product }>("GET", `/products/${encodeURIComponent(slug)}`),
    },
    quote: (lines: CartLine[]) => request<QuoteResponse>("POST", "/quote", { lines }),
    addresses: {
      list: () => request<{ addresses: Address[] }>("GET", "/addresses"),
      create: (input: AddressInput) => request<{ address: Address }>("POST", "/addresses", input),
      update: (id: string, input: AddressInput) => request<{ address: Address }>("PATCH", `/addresses/${id}`, input),
      remove: (id: string) => request<{ ok: true }>("DELETE", `/addresses/${id}`),
    },
    paymentMethods: {
      list: () => request<{ paymentMethods: PaymentMethod[] }>("GET", "/payment-methods"),
      create: (input: CardInput) => request<{ paymentMethod: PaymentMethod }>("POST", "/payment-methods", input),
      remove: (id: string) => request<{ ok: true }>("DELETE", `/payment-methods/${id}`),
    },
    checkout: (input: CheckoutInput) => request<CheckoutResult>("POST", "/checkout", input),
    orders: {
      list: () => request<{ orders: Order[] }>("GET", "/orders"),
      get: (id: string) => request<{ order: Order }>("GET", `/orders/${id}`),
    },
    subscriptions: {
      list: () => request<{ subscriptions: Subscription[] }>("GET", "/subscriptions"),
      get: (id: string) => request<{ subscription: Subscription }>("GET", `/subscriptions/${id}`),
      update: (id: string, input: SubscriptionUpdateInput) =>
        request<{ subscription: Subscription }>("PATCH", `/subscriptions/${id}`, input),
      setItems: (id: string, input: SubscriptionItemsInput) =>
        request<{ subscription: Subscription }>("PUT", `/subscriptions/${id}/items`, input),
      action: (id: string, action: SubscriptionAction) =>
        request<{ subscription: Subscription; order?: Order }>("POST", `/subscriptions/${id}/${action}`),
    },
    pets: {
      list: () => request<{ pets: Pet[] }>("GET", "/pets"),
      create: (input: PetInput) => request<{ pet: Pet }>("POST", "/pets", input),
      remove: (id: string) => request<{ ok: true }>("DELETE", `/pets/${id}`),
    },
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;
