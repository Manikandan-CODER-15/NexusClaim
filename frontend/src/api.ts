// NexusClaim Unified API Client

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'end_user' | 'investigator' | 'manager' | 'fraud_risk';
}

export interface Claim {
  id: string;
  claim_number: string;
  claimant_id: string;
  claimant?: string;
  category: string;
  incident_date: string;
  submission_date: string;
  priority: string;
  status: string;
  estimated_amount: number;
  description?: string;
  evidence_count?: number;
}

export interface AgentStatus {
  id: string;
  agent_name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  started_at?: string | null;
  completed_at?: string | null;
  duration_ms?: number;
  error_message?: string | null;
}

export interface Finding {
  id: string;
  finding_code: string;
  category: string;
  description: string;
  classification: string;
  confidence_score: number;
  recommended_action: string;
  human_review_status?: string;
  supporting_observations?: string[];
  contradicting_observations?: string[];
}

export const auth = {
  getToken: () => localStorage.getItem('access_token'),
  getUser: (): User | null => {
    const raw = localStorage.getItem('user_profile');
    return raw ? JSON.parse(raw) : null;
  },
  setAuth: (token: string, user: User) => {
    localStorage.setItem('access_token', token);
    localStorage.setItem('user_profile', JSON.stringify(user));
  },
  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_profile');
  },
  isAuthenticated: () => !!localStorage.getItem('access_token'),
};

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = auth.getToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(path, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    auth.logout();
    window.dispatchEvent(new Event('auth-expired'));
    throw new Error('Session expired or unauthorized');
  }

  if (!response.ok) {
    let errorMsg = `Request failed: ${response.status} ${response.statusText}`;
    try {
      const errorJson = await response.json();
      if (errorJson.detail) {
        errorMsg = typeof errorJson.detail === 'string' ? errorJson.detail : JSON.stringify(errorJson.detail);
      }
    } catch {
      // ignore
    }
    throw new Error(errorMsg);
  }

  return response.json();
}

export const api = {
  get: <T>(path: string, params?: Record<string, any>) => {
    let url = path;
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') {
          searchParams.append(k, String(v));
        }
      });
      const qs = searchParams.toString();
      if (qs) url += `?${qs}`;
    }
    return request<T>(url, { method: 'GET' });
  },

  post: <T>(path: string, body: any) =>
    request<T>(path, {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  patch: <T>(path: string, body: any) =>
    request<T>(path, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),

  upload: <T>(path: string, formData: FormData) =>
    request<T>(path, {
      method: 'POST',
      body: formData,
    }),
};

