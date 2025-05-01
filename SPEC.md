# Worktree `feat/api-cache-&-concurrency`

## Objective
Slash latency and duplicate OpenAI spend by adding a **Redis cache & lock layer** around `expand-concept` and by guaranteeing the DB uniqueness constraints are honoured at the API level.

## Key Deliverables
1. **Redis integration**  
   - Add `ioredis` client (`src/lib/redis.ts`).  
   - TTL = 24 h on successful cache entries, 5 min on in-flight locks.
2. **Concurrency guard**  
   - Before hitting OpenAI, acquire `SETNX lock:{sessionId}:{graphHash}`.  
   - If lock exists, return `202 Accepted` with `{retryAfter: seconds}`.  
   - Finally, `DEL` the lock or let it expire.
3. **Response caching**  
   - Cache key: `expand:{sessionId}:{graphHash}`; on cache hit return immediately.  
4. **Route refactors**  
   - `src/app/api/expand-concept/route.ts` (main work)  
   - `src/app/api/sessions/[sessionId]/expanded-concepts/route.ts` (read path hits cache first)  
5. **Config**  
   - Expect `REDIS_URL` in env; update `README.md` env table.

## File-level To-Dos
| File | Action |
| --- | --- |
| `src/lib/redis.ts` | **NEW** – simple singleton `createClient()` returning `IORedis` instance. |
| `src/app/api/expand-concept/route.ts` | Wrap OpenAI call with cache/lock logic; on success also `SET` cache. |
| `src/app/api/sessions/[sessionId]/expanded-concepts/route.ts` | First try `mget` from Redis, then fall back to Supabase. |
| `package.json` | Add `ioredis`, `@types/ioredis`. |
| `tests/api-cache/expandConcept.test.ts` | **NEW** – vitest tests with redis-mock. |

## Acceptance Criteria
- Cold request hits OpenAI once, subsequent identical requests (same session + graphHash) return cached payload.  
- Competing requests while one is running receive `202` + `Retry-After` header.  
- CI suite green.