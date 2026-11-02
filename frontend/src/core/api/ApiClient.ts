import { tokenStore } from "../auth/TokenStore";

const getApiBase = (): string => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  return "http://localhost:3000/api";
};

class ApiClient {
  private farmId: string | null = null;
  private apiBase: string = getApiBase();

  configure(config: { token?: string | null; farmId?: string | null }): void {
    // `token` is accepted but ignored: the access token is refreshed behind
    // the caller's back, so a copy held here would go stale. tokenStore is the
    // single source of truth.
    if (config.farmId !== undefined) this.farmId = config.farmId;
  }

  reset(): void {
    this.farmId = null;
  }

  private get token(): string | null {
    return tokenStore.getAccessToken();
  }

  getApiBase(): string {
    return this.apiBase;
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }
    if (this.farmId) {
      headers["X-Farm-Id"] = this.farmId;
    }
    return headers;
  }

  /**
   * Sends the request, and on a 401 refreshes the access token once and
   * replays it. Access tokens live 15 minutes, so without this every session
   * breaks a quarter of an hour in.
   *
   * Only one retry: if the replay also 401s the session is genuinely gone and
   * looping would just hammer the endpoint.
   */
  private async request<T>(path: string, method: string, body?: any): Promise<T> {
    const send = () =>
      fetch(`${this.apiBase}${path}`, {
        method,
        headers: this.getHeaders(),
        ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
      });

    let response = await send();

    if (response.status === 401 && tokenStore.getSession()) {
      const refreshed = await tokenStore.refresh();
      if (refreshed) {
        response = await send();
      }
    }

    return this.handleResponse<T>(response);
  }

  async get<T>(path: string): Promise<T> {
    return this.request<T>(path, "GET");
  }

  async post<T>(path: string, body: any): Promise<T> {
    return this.request<T>(path, "POST", body);
  }

  async put<T>(path: string, body: any): Promise<T> {
    return this.request<T>(path, "PUT", body);
  }

  async delete<T>(path: string): Promise<T> {
    return this.request<T>(path, "DELETE");
  }

  async uploadFile<T>(path: string, localUri: string, filename: string, mimeType: string): Promise<T> {
    const formData = new FormData();
    formData.append("file", {
      uri: localUri,
      name: filename,
      type: mimeType || "application/octet-stream",
    } as any);

    const send = () => {
      const headers: Record<string, string> = {};
      if (this.token) {
        headers["Authorization"] = `Bearer ${this.token}`;
      }
      if (this.farmId) {
        headers["X-Farm-Id"] = this.farmId;
      }
      return fetch(`${this.apiBase}${path}`, { method: "POST", body: formData, headers });
    };

    let response = await send();

    if (response.status === 401 && tokenStore.getSession()) {
      const refreshed = await tokenStore.refresh();
      if (refreshed) {
        response = await send();
      }
    }

    return this.handleResponse<T>(response);
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (response.status === 204) {
      return {} as T;
    }
    const text = await response.text();
    const trimmed = text.trim();
    const isHtml = trimmed.startsWith("<") || trimmed.toLowerCase().startsWith("<!doctype");

    if (isHtml) {
      throw new Error(`Unable to connect to backend server. Received HTML response from ${this.apiBase}. Ensure your backend server is running.`);
    }

    if (!response.ok) {
      try {
        const data = JSON.parse(text);
        throw new Error(data?.message || data?.error || `Request failed with status ${response.status}`);
      } catch (e: any) {
        if (e.message && !e.message.startsWith("JSON")) throw e;
        throw new Error(`Request failed with status ${response.status}`);
      }
    }

    if (!text) {
      return {} as T;
    }

    try {
      return JSON.parse(text) as T;
    } catch {
      throw new Error(`Failed to parse server response as JSON. Ensure backend server is running on ${this.apiBase}.`);
    }
  }
}

export const apiClient = new ApiClient();
