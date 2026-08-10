/**
 * Typed API client for TicketDesk backend.
 */

const BASE_URL = import.meta.env.VITE_API_URL ?? "";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}` };
}

import { saveTokens, getRefreshToken, clearTokens } from "@/lib/auth";

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: { 
      ...options.headers,
      "Content-Type": "application/json"  // Ensure Content-Type is always set last
    }
  });

  // Auto-refresh on 401 — but never for auth endpoints themselves
  const isAuthEndpoint = path.startsWith("/auth/");
  if (res.status === 401 && !isAuthEndpoint) {
    const refresh = getRefreshToken();
    if (refresh) {
      try {
        const tokenRes = await fetch(`${BASE_URL}/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refresh_token: refresh }),
        });
        if (tokenRes.ok) {
          const tokens = await tokenRes.json();
          saveTokens(tokens.access_token, tokens.refresh_token);
          // Retry original request with new token
          const retryRes = await fetch(`${BASE_URL}${path}`, {
            ...options,
            headers: {
              ...options.headers,
              "Content-Type": "application/json",
              Authorization: `Bearer ${tokens.access_token}`,
            },
          });
          if (retryRes.ok) {
            if (retryRes.status === 204) return undefined as T;
            return retryRes.json() as Promise<T>;
          }
          // If retry also fails, handle the error below
          const retryBody = await retryRes.json().catch(() => ({ detail: "Unknown error" }));
          const retryDetail = Array.isArray(retryBody.detail)
            ? retryBody.detail.map((e: { msg?: string; message?: string }) => e.msg || e.message || "Validation error").join(", ")
            : retryBody.detail ?? "Something went wrong";
          throw new Error(retryDetail);
        }
      } catch (refreshError) {
        console.error("Token refresh failed:", refreshError);
        // Fall through to error handling below
      }
    }
    // Refresh failed — clear tokens so the app redirects to login
    clearTokens();
    window.location.href = "/login";
    throw new Error("Session expired");
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: "Unknown error" }));
    
    // Handle validation errors from FastAPI
    let detail: string;
    if (Array.isArray(body.detail)) {
      // Pydantic validation errors
      detail = body.detail.map((e: { 
        msg?: string; 
        message?: string; 
        loc?: string[]; 
        input?: any; 
      }) => {
        const fieldName = e.loc?.[e.loc.length - 1] || "field";
        const msg = e.msg || e.message || "Invalid value";
        return `${fieldName}: ${msg}`;
      }).join(", ");
    } else if (typeof body.detail === 'string') {
      detail = body.detail;
    } else {
      detail = `HTTP ${res.status}: ${res.statusText}`;
    }
    
    throw new Error(detail);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// ─── Shared types ─────────────────────────────────────────────────────────────

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface MessageResponse {
  message: string;
}

export type UserRole = "owner" | "admin" | "agent";

export interface UserRead {
  id: number;
  tenant_id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  is_active: boolean;
  is_verified: boolean;
  notify_new_tickets: boolean;
  notify_ticket_updates: boolean;
  notify_comments: boolean;
  created_at: string;
  updated_at: string;
  company_name: string;
  tenant_slug: string;
}

export interface CustomerRead {
  id: number;
  tenant_id: number;
  name: string;
  email: string;
  created_at: string;
}

export type TicketStatus = "open" | "pending" | "resolved" | "closed";
export type TicketPriority = "low" | "normal" | "high" | "urgent";

export interface TicketRead {
  id: number;
  tenant_id: number;
  customer_id: number;
  assigned_agent_id: number | null;
  subject: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  created_at: string;
  updated_at: string | null;
  closed_at: string | null;
}

export interface CommentRead {
  id: number;
  ticket_id: number;
  author_user_id: number | null;
  author_customer_id: number | null;
  author_name: string;
  author_initials: string;
  body: string;
  is_internal: boolean;
  created_at: string;
}

export interface SubscriptionRead {
  id: number;
  tenant_id: number;
  subscription_tier: string;
  is_subscribed: boolean;
  subscribed_at: string | null;
  current_period_end: string | null;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface SignupPayload {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  company_name: string;
}

export const signup = (data: SignupPayload) =>
  request<TokenResponse>("/auth/signup", { method: "POST", body: JSON.stringify(data) });

export const login = (data: { email: string; password: string }) =>
  request<TokenResponse>("/auth/login", { method: "POST", body: JSON.stringify(data) });

export const refreshTokens = (refresh_token: string) =>
  request<TokenResponse>("/auth/refresh", { method: "POST", body: JSON.stringify({ refresh_token }) });

export const forgotPassword = (email: string) =>
  request<MessageResponse>("/auth/forgot-password", { method: "POST", body: JSON.stringify({ email }) });

export const resetPassword = (token: string, new_password: string) =>
  request<MessageResponse>("/auth/reset-password", { method: "POST", body: JSON.stringify({ token, new_password }) });

export const verifyEmail = (token: string) =>
  request<MessageResponse>("/auth/verify-email", { method: "POST", body: JSON.stringify({ token }) });

export const resendVerification = (access_token: string) =>
  request<MessageResponse>("/auth/resend-verification", {
    method: "POST",
    headers: authHeaders(access_token),
  });

// ─── Users ────────────────────────────────────────────────────────────────────

export const getMe = (token: string) =>
  request<UserRead>("/users/me", { headers: authHeaders(token) });

export const listUsers = (token: string) =>
  request<UserRead[]>("/users/", { headers: authHeaders(token) });

export const inviteUser = (token: string, data: { email: string; first_name: string; last_name: string; role: UserRole }) =>
  request<UserRead>("/users/invite", { method: "POST", body: JSON.stringify(data), headers: authHeaders(token) });

export const updateUser = (token: string, userId: number, data: Partial<{ first_name: string; last_name: string; role: UserRole; is_active: boolean; notify_new_tickets: boolean; notify_ticket_updates: boolean; notify_comments: boolean }>) =>
  request<UserRead>(`/users/${userId}`, { method: "PATCH", body: JSON.stringify(data), headers: authHeaders(token) });

export const removeUser = (token: string, userId: number) =>
  request<void>(`/users/${userId}`, { method: "DELETE", headers: authHeaders(token) });

// ─── Tickets ──────────────────────────────────────────────────────────────────

export interface ListTicketsParams {
  status?: TicketStatus;
  priority?: TicketPriority;
  assigned_to_me?: boolean;
  q?: string;
  skip?: number;
  limit?: number;
}

export const listTickets = (token: string, params: ListTicketsParams = {}) => {
  const q = new URLSearchParams();
  if (params.status) q.set("status", params.status);
  if (params.priority) q.set("priority", params.priority);
  if (params.assigned_to_me) q.set("assigned_to_me", "true");
  if (params.q) q.set("q", params.q);
  if (params.skip !== undefined) q.set("skip", String(params.skip));
  if (params.limit !== undefined) q.set("limit", String(params.limit));
  return request<TicketRead[]>(`/tickets/?${q}`, { headers: authHeaders(token) });
};

export const createTicket = (token: string, data: { subject: string; description: string; customer_id: number; priority: TicketPriority }) =>
  request<TicketRead>("/tickets/", { method: "POST", body: JSON.stringify(data), headers: authHeaders(token) });

export const getTicket = (token: string, id: number) =>
  request<TicketRead>(`/tickets/${id}`, { headers: authHeaders(token) });

export const updateTicket = (token: string, id: number, data: Partial<{ subject: string; description: string; priority: TicketPriority; status: TicketStatus; assigned_agent_id: number }>) =>
  request<TicketRead>(`/tickets/${id}`, { method: "PATCH", body: JSON.stringify(data), headers: authHeaders(token) });

export const deleteTicket = (token: string, id: number) =>
  request<void>(`/tickets/${id}`, { method: "DELETE", headers: authHeaders(token) });

export interface TicketStats {
  total: number;
  by_status: { open: number; pending: number; resolved: number; closed: number };
  by_priority: { urgent: number; high: number; normal: number; low: number };
}

export const getTicketStats = (token: string) =>
  request<TicketStats>("/tickets/stats", { headers: authHeaders(token) });

// ─── Customers ────────────────────────────────────────────────────────────────

export const listCustomers = (token: string, skip = 0, limit = 50) =>
  request<CustomerRead[]>(`/customers/?skip=${skip}&limit=${limit}`, { headers: authHeaders(token) });

export const createCustomer = (token: string, data: { name: string; email: string }) =>
  request<CustomerRead>("/customers/", { method: "POST", body: JSON.stringify(data), headers: authHeaders(token) });

// ─── Billing ──────────────────────────────────────────────────────────────────

export const getSubscription = (token: string) =>
  request<SubscriptionRead>("/billing", { headers: authHeaders(token) });

export const createCheckoutSession = (token: string) =>
  request<{ checkout_url: string }>("/billing/checkout-session", { method: "POST", headers: authHeaders(token) });

export const createPortalSession = (token: string) =>
  request<{ portal_url: string }>("/billing/portal-session", { method: "POST", headers: authHeaders(token) });
// ─── Tenant ───────────────────────────────────────────────────────────────────

export interface TenantRead {
  id: number;
  company_name: string;
  slug: string;
  stripe_customer_id: string | null;
  subscription_tier: string;
  created_at: string;
  updated_at: string;
}

export const getMyTenant = (token: string) =>
  request<TenantRead>("/tenant/me", { headers: authHeaders(token) });
