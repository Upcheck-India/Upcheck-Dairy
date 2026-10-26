import * as SecureStore from "expo-secure-store";

const AUTH_STORAGE_KEY = "upcheck_auth";

const getApiBase = (): string =>
  process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000/api";

export interface StoredSession {
  accessToken: string;
  refreshToken: string;
  userId: string;
}

type Listener = (session: StoredSession | null) => void;

/**
 * Owns the auth tokens and the refresh handshake.
 *
 * Access tokens last 15 minutes, so every authenticated request has to be able
 * to recover from a 401 by refreshing. This lives outside React because both
 * HTTP paths need it — the module `ApiClient` and the legacy `services/api.ts`
 * helpers — and neither is a component.
 *
 * `refresh()` is deliberately single-flight. `POST /auth/refresh` *consumes*
 * the refresh token and issues a new one (TokenService.verifyAndConsume…), so
 * two concurrent refreshes would mean the second presents an already-revoked
 * token, fail, and log the user out. Screens routinely fire several requests
 * at once, so that race is the normal case, not an edge case.
 */
class TokenStore {
  private session: StoredSession | null = null;
  private inFlight: Promise<string | null> | null = null;
  private listeners = new Set<Listener>();

  /** Load any persisted session. Returns it so callers can validate it. */
  async hydrate(): Promise<StoredSession | null> {
    try {
      const raw = await SecureStore.getItemAsync(AUTH_STORAGE_KEY);
      this.session = raw ? (JSON.parse(raw) as StoredSession) : null;
    } catch {
      this.session = null;
    }
    return this.session;
  }

  async set(session: StoredSession): Promise<void> {
    this.session = session;
    await SecureStore.setItemAsync(AUTH_STORAGE_KEY, JSON.stringify(session));
    this.emit();
  }

  async clear(): Promise<void> {
    this.session = null;
    this.inFlight = null;
    await SecureStore.deleteItemAsync(AUTH_STORAGE_KEY);
    this.emit();
  }

  getSession(): StoredSession | null {
    return this.session;
  }

  getAccessToken(): string | null {
    return this.session?.accessToken ?? null;
  }

  /**
   * Exchange the refresh token for a new pair.
   *
   * Resolves to the new access token, or null when the session is gone — in
   * which case the stored session has already been cleared and subscribers
   * notified, so callers should surface the original 401 rather than retry.
   */
  refresh(): Promise<string | null> {
    if (this.inFlight) return this.inFlight;

    const current = this.session;
    if (!current?.refreshToken) return Promise.resolve(null);

    this.inFlight = (async () => {
      try {
        const response = await fetch(`${getApiBase()}/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: current.userId,
            refreshToken: current.refreshToken,
          }),
        });

        if (!response.ok) {
          // The refresh token is spent, revoked or expired — nothing to retry.
          await this.clear();
          return null;
        }

        const data = (await response.json()) as {
          accessToken?: string;
          refreshToken?: string;
        };
        if (!data.accessToken || !data.refreshToken) {
          await this.clear();
          return null;
        }

        await this.set({
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          userId: current.userId,
        });
        return data.accessToken;
      } catch {
        // Network failure: keep the session so a later request can retry.
        // Clearing here would log people out every time they lose signal.
        return null;
      } finally {
        this.inFlight = null;
      }
    })();

    return this.inFlight;
  }

  /** Notified on login, refresh and logout. Null means the session ended. */
  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emit(): void {
    for (const listener of this.listeners) listener(this.session);
  }
}

export const tokenStore = new TokenStore();
