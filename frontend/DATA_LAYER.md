# Data layer

> Replaces `WATERMELONDB_MIGRATION.md`, which described a WatermelonDB + MMKV
> rewrite that was never carried out — there is no `@nozbe/watermelondb`
> dependency and no `database/` directory. What follows is what the app
> actually does.

## Shape

```
Screen → Hook → Provider (React context) → Repository → Mapper → ApiClient
                                              │
                                              └→ Storage (AsyncStorage cache)
```

A repository is the only thing that talks to the network or to storage. It
fetches DTOs, hands them to a mapper, and returns domain models. Callers never
learn where the data came from.

## Caching

Repositories write each successful fetch to AsyncStorage under
`upcheckdairy:<farmId>:<entity>`, and fall back to it when the request fails:

```ts
try {
  const dtos = await apiClient.get<AnimalResponseDto[]>("/animals");
  await Storage.set(this.getCacheKey(farmId), dtos);
  return AnimalMapper.toDomainList(dtos);
} catch (e) {
  const cached = await Storage.get<AnimalResponseDto[]>(this.getCacheKey(farmId));
  return cached ? AnimalMapper.toDomainList(cached) : [];
}
```

**This is read-only resilience, not offline support.** Writes go straight to
the API and fail if it is unreachable — there is no queue, no retry and no
conflict resolution. That work is ROADMAP phase 12 and has not started. Do not
describe the app as offline-capable.

DTOs are cached, not domain models, so a model gaining computed fields does not
invalidate anyone's cache.

## Storage in use

| Mechanism | Holds |
| --- | --- |
| `AsyncStorage` via `src/core/storage/Storage` | Per-farm entity caches, active farm id |
| `expo-secure-store` via `src/core/auth/TokenStore` | Access and refresh tokens |

`react-native-mmkv` is a dependency but is not currently used for app data.

## Farm scoping

Nearly everything is scoped to the active farm. `ApiClient` sends it as the
`X-Farm-Id` header, set by `FarmProvider` when the farm loads or changes, and
the backend re-checks that the farm belongs to the caller — the header is a
selector, never an authorisation.

Switching farms emits `FARM_CHANGED` on the event bus; providers refetch and
cache keys change with it, so one farm's data cannot be served to another.

## Auth and the two HTTP paths

There are two clients, for historical reasons:

- `src/core/api/ApiClient` — all feature modules.
- `services/api.ts` — auth and profile, predating the module structure.

Both read the access token from `TokenStore` and refresh-and-replay once on a
401. Neither holds its own copy of the token, because a copy goes stale the
moment a background refresh lands.

Uploaded files are fetched from `/api/files/:filename`, which requires a token,
so images render through `components/AuthedImage` rather than a bare `<Image>`.
