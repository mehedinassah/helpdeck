export const API_URL =
  (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") ||
  "http://localhost:8000";

export interface Tenant {
  id: string;
  name: string;
  api_key: string;
  widget_key: string | null;
  allowed_domains: string | null;
  plan: string;
  message_limit: number;
  created_at: string;
}

export interface Document {
  id: string;
  title: string;
  source: string;
  status: string;
  chunk_count: number;
  created_at: string;
}

export interface Usage {
  plan: string;
  message_limit: number;
  messages_used: number;
  messages_remaining: number;
}

export interface PlanInfo {
  id: string;
  name: string;
  price_usd: number;
  message_limit: number;
}

export interface PlansResponse {
  configured: boolean;
  current_plan: string;
  status: string;
  plans: PlanInfo[];
}

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let detail = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      detail = body.detail || detail;
    } catch {
      /* ignore */
    }
    throw new Error(detail);
  }
  return res.json() as Promise<T>;
}

function authHeaders(apiKey: string): HeadersInit {
  return { "X-API-Key": apiKey, "Content-Type": "application/json" };
}

export const api = {
  createTenant(name: string): Promise<Tenant> {
    return fetch(`${API_URL}/api/tenants`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    }).then((r) => handle<Tenant>(r));
  },

  signup(email: string, password: string, name: string): Promise<Tenant> {
    return fetch(`${API_URL}/api/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name }),
    }).then((r) => handle<Tenant>(r));
  },

  login(email: string, password: string): Promise<Tenant> {
    return fetch(`${API_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    }).then((r) => handle<Tenant>(r));
  },

  me(apiKey: string): Promise<Tenant> {
    return fetch(`${API_URL}/api/me`, { headers: authHeaders(apiKey) }).then((r) =>
      handle<Tenant>(r)
    );
  },

  usage(apiKey: string): Promise<Usage> {
    return fetch(`${API_URL}/api/usage`, { headers: authHeaders(apiKey) }).then((r) =>
      handle<Usage>(r)
    );
  },

  listDocuments(apiKey: string): Promise<Document[]> {
    return fetch(`${API_URL}/api/documents`, { headers: authHeaders(apiKey) }).then((r) =>
      handle<Document[]>(r)
    );
  },

  addTextDocument(apiKey: string, title: string, content: string): Promise<Document> {
    return fetch(`${API_URL}/api/documents`, {
      method: "POST",
      headers: authHeaders(apiKey),
      body: JSON.stringify({ title, content }),
    }).then((r) => handle<Document>(r));
  },

  uploadDocument(apiKey: string, file: File): Promise<Document> {
    const form = new FormData();
    form.append("file", file);
    return fetch(`${API_URL}/api/documents/upload`, {
      method: "POST",
      headers: { "X-API-Key": apiKey },
      body: form,
    }).then((r) => handle<Document>(r));
  },

  deleteDocument(apiKey: string, id: string): Promise<{ deleted: string }> {
    return fetch(`${API_URL}/api/documents/${id}`, {
      method: "DELETE",
      headers: authHeaders(apiKey),
    }).then((r) => handle<{ deleted: string }>(r));
  },

  getPlans(apiKey: string): Promise<PlansResponse> {
    return fetch(`${API_URL}/api/billing/plans`, { headers: authHeaders(apiKey) }).then((r) =>
      handle<PlansResponse>(r)
    );
  },

  checkout(apiKey: string, plan: string): Promise<{ url: string }> {
    return fetch(`${API_URL}/api/billing/checkout`, {
      method: "POST",
      headers: authHeaders(apiKey),
      body: JSON.stringify({ plan }),
    }).then((r) => handle<{ url: string }>(r));
  },

  portal(apiKey: string): Promise<{ url: string }> {
    return fetch(`${API_URL}/api/billing/portal`, {
      method: "POST",
      headers: authHeaders(apiKey),
    }).then((r) => handle<{ url: string }>(r));
  },
};
