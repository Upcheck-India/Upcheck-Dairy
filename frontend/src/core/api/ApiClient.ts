const getApiBase = (): string => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  return "http://192.168.0.8:3000/api";
};

class ApiClient {
  private token: string | null = null;
  private farmId: string | null = null;
  private apiBase: string = getApiBase();

  configure(config: { token?: string | null; farmId?: string | null }): void {
    if (config.token !== undefined) this.token = config.token;
    if (config.farmId !== undefined) this.farmId = config.farmId;
  }

  reset(): void {
    this.token = null;
    this.farmId = null;
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

  async get<T>(path: string): Promise<T> {
    const response = await fetch(`${this.apiBase}${path}`, {
      method: "GET",
      headers: this.getHeaders(),
    });
    return this.handleResponse<T>(response);
  }

  async post<T>(path: string, body: any): Promise<T> {
    const response = await fetch(`${this.apiBase}${path}`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(body),
    });
    return this.handleResponse<T>(response);
  }

  async put<T>(path: string, body: any): Promise<T> {
    const response = await fetch(`${this.apiBase}${path}`, {
      method: "PUT",
      headers: this.getHeaders(),
      body: JSON.stringify(body),
    });
    return this.handleResponse<T>(response);
  }

  async delete<T>(path: string): Promise<T> {
    const response = await fetch(`${this.apiBase}${path}`, {
      method: "DELETE",
      headers: this.getHeaders(),
    });
    return this.handleResponse<T>(response);
  }

  async uploadFile<T>(path: string, localUri: string, filename: string, mimeType: string): Promise<T> {
    const formData = new FormData();
    formData.append("file", {
      uri: localUri,
      name: filename,
      type: mimeType || "application/octet-stream",
    } as any);

    const headers: Record<string, string> = {};
    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }
    if (this.farmId) {
      headers["X-Farm-Id"] = this.farmId;
    }

    const response = await fetch(`${this.apiBase}${path}`, {
      method: "POST",
      body: formData,
      headers,
    });
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
