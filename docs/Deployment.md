## Production Deployment

**Only `TimTruong.ApiService` is deployed to production.** AppHost is a dev-only orchestration tool and is never run in production.

### Backend
API + PostgreSQL run as containers via docker-compose on the production host (`server/Dockerfile` builds the API image; the compose file itself lives on the host, not in this repo). TLS terminates in front (Cloudflare Tunnel + Caddy), so `ASPNETCORE_FORWARDEDHEADERS_ENABLED` must be set for forwarded headers to be honored.

Env vars set in docker-compose:
```shell
ConnectionStrings__DefaultConnection="Host=your-db;Database=your-db;Username=your-user;Password=your-password"

# NOTE: arrays merge by index 
# base appsettings.json must keep Cors:AllowedOrigins empty or stale entries leak through
Cors__AllowedOrigins__0="https://yourdomain.com"
Cors__AllowedOrigins__1="https://www.yourdomain.com"

Features__EnableOpenApi=true
Features__EnableAutoMigrations=true
```

### Frontend (Cloudflare Workers)
```shell
cd client
bun run deploy   # build + wrangler deploy
```
Set `API_BASE_URL` in `wrangler.jsonc` to the production API URL — `worker/index.ts` uses it to inject per-university Open Graph meta for social crawlers. The client is a TanStack Start app: the Worker server-renders every page, and Cloudflare serves the built assets (`dist/client`) directly. `vite build` generates the real deploy config in `dist/server/wrangler.json`, and `wrangler deploy` finds it through `.wrangler/deploy/config.json`, so don't pass `--config`. Run `npx wrangler deploy --dry-run` after a build to check what will be uploaded.

---
