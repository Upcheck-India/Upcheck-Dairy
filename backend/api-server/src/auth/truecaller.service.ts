import { Injectable, Logger, Optional, UnauthorizedException, Inject } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import axios from "axios";
import * as crypto from "crypto";
import { RedisService } from "../redis/redis.service";

export interface TruecallerPublicKey {
  keyName: string;
  key: string;
}

interface DecodedPayload {
  requestNonce: string;
  requestTime: number;
  verifier?: string;
  phoneNumberHash?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  email?: string;
  avatarUrl?: string;
  countryCode?: string;
  city?: string;
  isTrueName?: boolean;
}

export interface VerifySignedPayloadInput {
  payload: string;
  signature: string;
  signatureAlgorithm: string;
  requestNonce: string;
}

export interface VerifiedTruecallerProfile {
  phoneNumber: string;
  firstName: string;
  lastName?: string;
  email?: string;
  avatarUrl?: string;
}

export interface TruecallerKeyCache {
  getKeys(): Promise<TruecallerPublicKey[]>;
}

export interface NonceReplayStore {
  assertUnused(nonce: string): Promise<void>;
  markUsed(nonce: string): Promise<void>;
}

export const TRUECALLER_PUBLIC_KEY_MIN_TTL_SECONDS = 60 * 60;
export const TRUECALLER_PUBLIC_KEY_MAX_TTL_SECONDS = 24 * 60 * 60;
export const TRUECALLER_PUBLIC_KEY_DEFAULT_TTL_SECONDS = TRUECALLER_PUBLIC_KEY_MIN_TTL_SECONDS;

export function resolvePublicKeyTtlSeconds(
  raw: string | undefined,
  logger?: Pick<Logger, "warn">,
): number {
  const min = TRUECALLER_PUBLIC_KEY_MIN_TTL_SECONDS;
  const max = TRUECALLER_PUBLIC_KEY_MAX_TTL_SECONDS;
  const def = TRUECALLER_PUBLIC_KEY_DEFAULT_TTL_SECONDS;
  if (raw === undefined || raw === null || raw === "") return def;
  const parsed = parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    logger?.warn(`TRUECALLER_PUBLIC_KEY_TTL_SECONDS="${raw}" is invalid; using default ${def}s`);
    return def;
  }
  if (parsed < min) {
    logger?.warn(`TRUECALLER_PUBLIC_KEY_TTL_SECONDS=${parsed} is below the ${min}s minimum required by Requirement 9.2; clamping to ${min}s`);
    return min;
  }
  if (parsed > max) {
    logger?.warn(`TRUECALLER_PUBLIC_KEY_TTL_SECONDS=${parsed} exceeds the ${max}s maximum required by Requirement 9.2; clamping to ${max}s`);
    return max;
  }
  return parsed;
}

export const TRUECALLER_DEFAULT_KEYS_API_URL = "https://api4.truecaller.com/v1/key";

export function extractTruecallerPublicKeys(raw: unknown): TruecallerPublicKey[] {
  const candidates: unknown[] = Array.isArray(raw)
    ? raw
    : raw && typeof raw === "object" && Array.isArray((raw as { keys?: unknown[] }).keys)
      ? (raw as { keys: unknown[] }).keys
      : [];
  const out: TruecallerPublicKey[] = [];
  for (const entry of candidates) {
    if (!entry || typeof entry !== "object") continue;
    const e = entry as { key?: unknown; keyName?: unknown };
    if (typeof e.key !== "string" || e.key.length === 0) continue;
    out.push({
      keyName: typeof e.keyName === "string" ? e.keyName : "",
      key: e.key,
    });
  }
  return out;
}

export class InMemoryTruecallerKeyCache implements TruecallerKeyCache {
  private cache: { keys: TruecallerPublicKey[]; fetchedAt: number } | null = null;
  private inflight: Promise<TruecallerPublicKey[]> | null = null;

  constructor(
    private readonly url: string,
    private readonly ttlMs: number,
    private readonly logger?: Pick<Logger, "warn" | "error" | "log">,
    private readonly now: () => number = Date.now,
    private readonly fetcher: (url: string) => Promise<{ data: unknown }> = (u) => axios.get(u),
  ) {
    if (!Number.isFinite(ttlMs) || ttlMs <= 0) {
      throw new Error(`InMemoryTruecallerKeyCache: ttlMs must be a positive finite number (got ${ttlMs})`);
    }
  }

  async getKeys(): Promise<TruecallerPublicKey[]> {
    const now = this.now();
    if (this.cache && now - this.cache.fetchedAt < this.ttlMs) {
      return this.cache.keys;
    }
    if (this.inflight) return this.inflight;
    const fetchPromise = this.fetchAndStore();
    this.inflight = fetchPromise;
    try {
      return await fetchPromise;
    } finally {
      if (this.inflight === fetchPromise) this.inflight = null;
    }
  }

  private async fetchAndStore(): Promise<TruecallerPublicKey[]> {
    let raw: unknown;
    try {
      const res = await this.fetcher(this.url);
      raw = res?.data;
    } catch (err) {
      this.logger?.error?.(`Truecaller key fetch failed: ${(err as Error).message}`);
      throw new UnauthorizedException({
        success: false,
        message: "Public key fetch failed",
      });
    }
    const keys = extractTruecallerPublicKeys(raw);
    if (!keys.length) {
      this.logger?.error?.("Truecaller key fetch returned zero usable keys");
      throw new UnauthorizedException({
        success: false,
        message: "Public key fetch failed",
      });
    }
    this.cache = { keys, fetchedAt: this.now() };
    return keys;
  }
}

export const TRUECALLER_NONCE_MIN_TTL_SECONDS = 600;

export function resolveNonceTtlSeconds(
  raw: string | undefined,
  logger?: Pick<Logger, "warn">,
): number {
  const floor = TRUECALLER_NONCE_MIN_TTL_SECONDS;
  if (raw === undefined || raw === null || raw === "") return floor;
  const parsed = parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    logger?.warn(`TRUECALLER_NONCE_TTL_SECONDS="${raw}" is invalid; using ${floor}s minimum`);
    return floor;
  }
  if (parsed < floor) {
    logger?.warn(`TRUECALLER_NONCE_TTL_SECONDS=${parsed} is below the ${floor}s minimum required by Requirement 9.7; clamping to ${floor}s`);
    return floor;
  }
  return parsed;
}

export class InMemoryNonceReplayStore implements NonceReplayStore {
  private readonly store = new Map<string, number>();

  constructor(
    private readonly ttlMs: number,
    private readonly now: () => number = Date.now,
  ) {
    if (!Number.isFinite(ttlMs) || ttlMs <= 0) {
      throw new Error(`InMemoryNonceReplayStore: ttlMs must be a positive finite number (got ${ttlMs})`);
    }
  }

  size(): number {
    return this.store.size;
  }

  async assertUnused(nonce: string): Promise<void> {
    this.evictExpired();
    const expiresAt = this.store.get(nonce);
    if (expiresAt !== undefined && expiresAt > this.now()) {
      throw new UnauthorizedException({
        success: false,
        message: "Nonce already used",
      });
    }
  }

  async markUsed(nonce: string): Promise<void> {
    this.store.set(nonce, this.now() + this.ttlMs);
  }

  private evictExpired(): void {
    const now = this.now();
    for (const [nonce, expiresAt] of this.store.entries()) {
      if (expiresAt <= now) this.store.delete(nonce);
    }
  }
}

export class RedisNonceReplayStore implements NonceReplayStore {
  private static readonly PREFIX = "truecaller:nonce:";

  constructor(
    private readonly redis: {
      get(key: string): Promise<string | null>;
      set(key: string, value: string, mode?: "EX", duration?: number): Promise<any>;
    },
    private readonly ttlMs: number,
  ) {
    if (!Number.isFinite(ttlMs) || ttlMs <= 0) {
      throw new Error(`RedisNonceReplayStore: ttlMs must be a positive finite number (got ${ttlMs})`);
    }
  }

  private key(nonce: string): string {
    return `${RedisNonceReplayStore.PREFIX}${nonce}`;
  }

  async assertUnused(nonce: string): Promise<void> {
    const existing = await this.redis.get(this.key(nonce));
    if (existing !== null) {
      throw new UnauthorizedException({
        success: false,
        message: "Nonce already used",
      });
    }
  }

  async markUsed(nonce: string): Promise<void> {
    await this.redis.set(this.key(nonce), "1", "EX", Math.ceil(this.ttlMs / 1000));
  }
}

@Injectable()
export class TruecallerService {
  private readonly logger = new Logger(TruecallerService.name);

  private readonly keysApiUrl: string;
  private readonly profileApiUrl: string;
  private readonly publicKeyTtlMs: number;
  private readonly nonceTtlMs: number;

  private readonly oauthClientId: string;
  private readonly oauthTokenUrl: string;
  private readonly oauthUserInfoUrl: string;

  private readonly keyCache: TruecallerKeyCache;
  private readonly nonceStore: NonceReplayStore;

  constructor(
    @Inject(ConfigService) private readonly configService: ConfigService,
    @Optional() @Inject(RedisService) private readonly redisService?: RedisService,
  ) {
    this.keysApiUrl = this.configService.get<string>("TRUECALLER_KEYS_API_URL") || TRUECALLER_DEFAULT_KEYS_API_URL;
    this.profileApiUrl = this.configService.get<string>("TRUECALLER_PROFILE_API_URL") || "https://api5.truecaller.com/v1/otp/installation/verify/profile";

    const oauthBase = this.configService.get<string>("TRUECALLER_OAUTH_BASE_URL") || "https://oauth-account-noneu.truecaller.com";
    this.oauthClientId = this.configService.get<string>("TRUECALLER_OAUTH_CLIENT_ID") || "e98dcupeqtmcocbxr7qb4g7b4sub8blazhxrt-1ikmw";
    this.oauthTokenUrl = this.configService.get<string>("TRUECALLER_OAUTH_TOKEN_URL") || `${oauthBase}/v1/token`;
    this.oauthUserInfoUrl = this.configService.get<string>("TRUECALLER_OAUTH_USERINFO_URL") || `${oauthBase}/v1/userinfo`;

    const keyTtlSec = resolvePublicKeyTtlSeconds(
      this.configService.get<string>("TRUECALLER_PUBLIC_KEY_TTL_SECONDS"),
      this.logger,
    );
    const nonceTtlSec = resolveNonceTtlSeconds(
      this.configService.get<string>("TRUECALLER_NONCE_TTL_SECONDS"),
      this.logger,
    );
    this.publicKeyTtlMs = keyTtlSec * 1000;
    this.nonceTtlMs = nonceTtlSec * 1000;

    this.keyCache = this.buildInMemoryKeyCache();
    this.nonceStore = this.redisService ? new RedisNonceReplayStore(this.redisService, this.nonceTtlMs) : this.buildInMemoryNonceStore();
  }

  async verifySignedPayload(input: VerifySignedPayloadInput): Promise<VerifiedTruecallerProfile> {
    const { payload, signature, signatureAlgorithm, requestNonce } = input;

    await this.nonceStore.assertUnused(requestNonce);

    const algo = signatureAlgorithm.includes("512") ? "RSA-SHA512" : "RSA-SHA256";
    const keys = await this.keyCache.getKeys();

    const verified = keys.some(({ key }) => {
      try {
        const verifier = crypto.createVerify(algo);
        verifier.update(payload);
        const pem = this.toPem(key);
        return verifier.verify(pem, signature, "base64");
      } catch {
        return false;
      }
    });

    if (!verified) {
      throw new UnauthorizedException({
        success: false,
        message: "Invalid signature",
      });
    }

    let decoded: DecodedPayload;
    try {
      decoded = JSON.parse(Buffer.from(payload, "base64").toString("utf-8")) as DecodedPayload;
    } catch {
      throw new UnauthorizedException({
        success: false,
        message: "Invalid payload",
      });
    }

    if (decoded.requestNonce !== requestNonce) {
      throw new UnauthorizedException({
        success: false,
        message: "Nonce mismatch",
      });
    }

    if (typeof decoded.requestTime !== "number" || Date.now() - decoded.requestTime > 600_000) {
      throw new UnauthorizedException({
        success: false,
        message: "Payload expired",
      });
    }

    await this.nonceStore.markUsed(requestNonce);

    if (decoded.phoneNumber) {
      this.logger.log(`Truecaller signed payload verified for ${this.maskPhone(decoded.phoneNumber)}`);
    }

    return {
      phoneNumber: decoded.phoneNumber ?? "",
      firstName: decoded.firstName ?? "User",
      lastName: decoded.lastName,
      email: decoded.email,
      avatarUrl: decoded.avatarUrl,
    };
  }

  async verifyAccessToken(accessToken: string, expectedPhoneNumber: string): Promise<VerifiedTruecallerProfile> {
    let res;
    try {
      res = await axios.get(this.profileApiUrl, {
        headers: { Authorization: `Bearer ${accessToken}` },
        validateStatus: () => true,
      });
    } catch (err) {
      this.logger.warn(`Truecaller profile API request failed for ${this.maskPhone(expectedPhoneNumber)}: ${(err as Error).message}`);
      throw new UnauthorizedException({
        success: false,
        message: "Invalid access token",
      });
    }

    if (res.status < 200 || res.status >= 300) {
      this.logger.warn(`Truecaller profile API returned ${res.status} for ${this.maskPhone(expectedPhoneNumber)}`);
      throw new UnauthorizedException({
        success: false,
        message: "Invalid access token",
      });
    }

    const profile = res.data;
    if (!profile || typeof profile.phoneNumber !== "string" || profile.phoneNumber.length === 0) {
      throw new UnauthorizedException({
        success: false,
        message: "Invalid Truecaller profile",
      });
    }

    if (this.normalizePhone(profile.phoneNumber) !== this.normalizePhone(expectedPhoneNumber)) {
      this.logger.warn(`Truecaller profile phone mismatch: profile=${this.maskPhone(profile.phoneNumber)} expected=${this.maskPhone(expectedPhoneNumber)}`);
      throw new UnauthorizedException({
        success: false,
        message: "Phone number mismatch",
      });
    }

    this.logger.log(`Truecaller access token verified for ${this.maskPhone(profile.phoneNumber)}`);

    return {
      phoneNumber: profile.phoneNumber,
      firstName: typeof profile.firstName === "string" && profile.firstName.length > 0 ? profile.firstName : "User",
      lastName: typeof profile.lastName === "string" ? profile.lastName : undefined,
      email: typeof profile.email === "string" ? profile.email : undefined,
      avatarUrl: typeof profile.avatarUrl === "string" ? profile.avatarUrl : undefined,
    };
  }

  async verifyOAuthCode(authorizationCode: string, codeVerifier: string): Promise<VerifiedTruecallerProfile> {
    let tokenRes;
    try {
      const form = new URLSearchParams({
        grant_type: "authorization_code",
        client_id: this.oauthClientId,
        code: authorizationCode,
        code_verifier: codeVerifier,
      });
      tokenRes = await axios.post(this.oauthTokenUrl, form.toString(), {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        validateStatus: () => true,
      });
    } catch (err) {
      this.logger.warn(`Truecaller OAuth token exchange transport error: ${(err as Error).message}`);
      throw new UnauthorizedException({
        success: false,
        message: "Invalid authorization code",
      });
    }

    if (tokenRes.status < 200 || tokenRes.status >= 300) {
      this.logger.warn(`Truecaller OAuth token endpoint returned ${tokenRes.status}: ${JSON.stringify(tokenRes.data)?.slice(0, 500)}`);
      throw new UnauthorizedException({
        success: false,
        message: "Invalid authorization code",
      });
    }

    const accessToken = tokenRes.data && typeof tokenRes.data.access_token === "string" ? tokenRes.data.access_token : "";
    if (!accessToken) {
      throw new UnauthorizedException({
        success: false,
        message: "Invalid authorization code",
      });
    }

    let infoRes;
    try {
      infoRes = await axios.get(this.oauthUserInfoUrl, {
        headers: { Authorization: `Bearer ${accessToken}` },
        validateStatus: () => true,
      });
    } catch (err) {
      this.logger.warn(`Truecaller OAuth userinfo transport error: ${(err as Error).message}`);
      throw new UnauthorizedException({
        success: false,
        message: "Invalid authorization code",
      });
    }

    if (infoRes.status < 200 || infoRes.status >= 300) {
      this.logger.warn(`Truecaller OAuth userinfo returned ${infoRes.status}: ${JSON.stringify(infoRes.data)?.slice(0, 500)}`);
      throw new UnauthorizedException({
        success: false,
        message: "Invalid authorization code",
      });
    }

    const profile = infoRes.data ?? {};
    const rawPhone = typeof profile.phone_number === "string" ? profile.phone_number : typeof profile.phoneNumber === "string" ? profile.phoneNumber : "";
    if (!rawPhone) {
      throw new UnauthorizedException({
        success: false,
        message: "Invalid Truecaller profile",
      });
    }

    const firstName =
      (typeof profile.given_name === "string" && profile.given_name) ||
      (typeof profile.firstName === "string" && profile.firstName) ||
      "User";
    const lastName =
      (typeof profile.family_name === "string" && profile.family_name) ||
      (typeof profile.lastName === "string" && profile.lastName) ||
      undefined;
    const email = (typeof profile.email === "string" && profile.email) || undefined;
    const avatarUrl =
      (typeof profile.picture === "string" && profile.picture) ||
      (typeof profile.avatarUrl === "string" && profile.avatarUrl) ||
      undefined;

    this.logger.log(`Truecaller OAuth code verified for ${this.maskPhone(rawPhone)}`);

    return { phoneNumber: rawPhone, firstName, lastName, email, avatarUrl };
  }

  normalizePhone(input: string | null | undefined): string {
    if (typeof input !== "string") return "";
    const digits = input.replace(/\D/g, "");
    if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2);
    return digits;
  }

  maskPhone(input: string | null | undefined): string {
    const digits = this.normalizePhone(input);
    if (digits.length < 4) return "+91XXXXXXXXXX";
    return `+91XXXXXX${digits.slice(-4)}`;
  }

  private buildInMemoryKeyCache(): TruecallerKeyCache {
    return new InMemoryTruecallerKeyCache(this.keysApiUrl, this.publicKeyTtlMs, this.logger);
  }

  private buildInMemoryNonceStore(): NonceReplayStore {
    return new InMemoryNonceReplayStore(this.nonceTtlMs);
  }

  private toPem(key: string): string {
    if (key.includes("-----BEGIN")) return key;
    return `-----BEGIN PUBLIC KEY-----\n${key}\n-----END PUBLIC KEY-----`;
  }
}
