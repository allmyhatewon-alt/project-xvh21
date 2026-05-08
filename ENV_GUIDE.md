# PENG hub — environment & API reference

This file tells you exactly **where every config goes** and what each API route does.

---

## 1. Where things live

```
/app/
├── frontend/                  # Next.js app (everything UI + API)
│   ├── .env                   # ← YOU EDIT THIS for local dev
│   ├── .env.example           # official template (commit this; never commit .env)
│   ├── prisma/
│   │   ├── schema.prisma      # database shape (currently SQLite, swap to postgres for prod)
│   │   └── dev.db             # the actual SQLite database (auto-created)
│   ├── public/
│   │   ├── uploads/audio/     # ← user-uploaded MP3s land here
│   │   └── bg/                # ← (optional) drop your own background MP3s here for the OS player
│   ├── app/
│   │   ├── api/               # all API routes — Next.js route handlers
│   │   ├── auth/              # signin / signup pages
│   │   ├── hub/               # the social hub (feed, profile, settings…)
│   │   ├── (space)/[username] # personal space — visit /@yourname
│   │   └── page.tsx           # landing page
│   └── components/            # React components
└── backend/
    └── server.py              # tiny FastAPI proxy → Next.js (DON'T add app logic here)
```

---

## 2. Local environment (`/app/frontend/.env`)

| Key | What it does |
|---|---|
| `DATABASE_URL` | Prisma database. Default is SQLite (`file:./dev.db`). For prod, swap provider in `schema.prisma` to `postgresql` and use a Supabase pooled URL. |
| `JWT_SECRET` | Signs the session cookie. **Change in prod.** Run `openssl rand -hex 32` to generate. |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` / `ADMIN_USERNAME` / `ADMIN_DISPLAY_NAME` | The admin user gets created on `yarn db:seed`. You log in with the email + password. |
| `UPLOAD_DIR` | Where MP3s are saved. Default: `./public/uploads`. Files at `public/uploads/audio/<userId>/<ts>-<file>.mp3`. |
| `UPLOAD_PUBLIC_PATH` | URL prefix served by Next.js for uploads. Default `uploads` → `/uploads/audio/...`. |
| `MAX_UPLOAD_BYTES` | Per-file size limit. Default 50MB. |
| `NEXT_PUBLIC_BASE_URL` | Public origin (used in OG tags etc.). |
| `KITTEN_TTS_URL` | Optional local KittenTTS HTTP endpoint for free AI stream voices. The app posts `{text, voice, rate, pitch, format}` and expects audio back. |
| `BUNNY_STREAM_LIBRARY_ID` | Optional Bunny Stream video library ID for CDN-backed stream replays and Bunny embeds. |
| `BUNNY_STREAM_API_KEY` | Server-only Bunny Stream library API key. Do not expose it to client-side code. |
| `BUNNY_STREAM_PLAYER_BASE` | Bunny player embed base. Default: `https://player.mediadelivery.net/embed`. |
| `BUNNY_STREAM_CDN_HOSTNAME` | Optional Bunny CDN hostname for path-only HLS/MP4 sources, for example `vz-your-zone.b-cdn.net`. |
| `BUNNY_STREAM_PULL_ZONE` | Optional Bunny pull zone name for deployment notes and future API automation. |
| `MEDIAMTX_HLS_URL` | MediaMTX HLS/browser playback origin, default local value `http://127.0.0.1:8888`. |
| `MEDIAMTX_WEBRTC_URL` | MediaMTX WebRTC/browser playback origin, default local value `http://127.0.0.1:8889`. |
| `MEDIAMTX_RTMP_URL` | MediaMTX RTMP ingest origin for OBS or studio apps, default local value `rtmp://127.0.0.1:1935`. |
| `MEDIAMTX_PLAYBACK_PROTOCOL` | `hls` or `webrtc`. Pengelus uses this when turning a stream path into an iframe URL. |
| `R2_ACCOUNT_ID` / `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` / `R2_BUCKET_NAME` | Cloudflare R2 S3-compatible credentials used by `/api/upload` when you want production-safe storage instead of local disk. |
| `R2_PUBLIC_URL` | Public bucket base URL or custom domain, for example `https://assets.pengelus.me`. Server routes use this to return real public file URLs after upload. |
| `NEXT_PUBLIC_R2_PUBLIC_URL` | Client-safe copy of the same public bucket base URL. Use this when frontend code needs to read public assets directly from R2. |
| `NEXT_PUBLIC_MUSIC_BASE_URL` | Optional override for landing-page music. Point it at the public R2 bucket/custom domain and the player will request tracks from `<base>/bg/<filename>`. |

After editing `.env`: run `sudo supervisorctl restart frontend`.

Important:
- If your database password contains special characters like `$`, `@`, `:`, `/`, `?`, or `#`, URL-encode the password inside `DATABASE_URL` and `DIRECT_URL`. Example: a password starting with `$` should use `%24` in the connection string.

---

## 3. Database commands

```bash
cd /app/frontend
yarn prisma db push        # apply schema changes to dev.db (no migrations needed)
yarn prisma generate       # regenerate the Prisma client after schema edits
yarn db:seed               # (re)create admin + boards + achievements
yarn prisma studio         # open a local DB GUI on :5555
```

---

## 4. API endpoints (all under `/api`, served by Next.js, proxied through FastAPI on :8001)

### Auth
- `POST /api/auth/register` — `{username, displayName, email, password}` → sets cookie, returns `{ok, username}`
- `POST /api/auth/login` — `{email, password}` → sets cookie
- `POST /api/auth/logout` — clears cookie
- `GET  /api/auth/me` — returns `{user}` (or `{user: null}`)
- `GET  /api/auth/check-username?username=foo` — returns `{available: bool}`

### Posts / Boards / Comments
- `GET  /api/boards` — list all boards
- `GET  /api/posts?sort=hot|new|rising&board=<slug>&following=1&saved=1` — feed
- `POST /api/posts` — `{boardSlug, title, body, flair?}` → create post
- `GET  /api/posts/:id` — post detail with comments
- `DELETE /api/posts/:id` — delete (author or admin only)
- `POST /api/posts/:id/vote` — `{value: 1 | -1 | 0}` → up/down/clear vote
- `POST /api/posts/:id/comments` — `{body}` → add comment

### Profile / Showcase / Space
- `PUT  /api/profile` — `{displayName?, bio?, image?, bannerUrl?, accentColor?}`
- `GET  /api/showcase` — returns the current user's HubProfile (showcase blocks, socials, interests)
- `PUT  /api/showcase` — update showcase
- `GET  /api/space` — returns the current user's Space (block-based personal page)
- `PUT  /api/space` — `{blocks?, published?, customCss?, metaTitle?, metaDescription?}`

### Economy
- `GET  /api/check-in` — `{canCheckIn, streak, longestStreak, shards}`
- `POST /api/check-in` — performs daily check-in, awards shards + xp with streak multiplier

### Files
- `POST /api/upload` (multipart: `file`, `title?`, `artist?`) — uploads an MP3 to `public/uploads/audio/<userId>/...` and returns `{ok, upload}`
- `GET  /api/upload` — list current user's uploads

### Misc
- `GET  /api/leaderboard` — top users by xp
- `GET  /api/_health` — proxy health check

### Live
- `POST /api/live/tts` - widget-source TTS audio. Uses OpenAI when provider is `openai`, or `KITTEN_TTS_URL` when provider is `kitten`.
- Open Studio stream type `bunny` accepts `libraryId/videoId`, Bunny player links, Bunny `.m3u8`, or Bunny `.mp4` URLs for CDN-backed playback.
- Open Studio stream type `mediamtx` accepts a stream path like `peng` and turns it into the configured MediaMTX HLS/WebRTC browser player URL.

---

## 5. How auth works (so you can debug)

1. `POST /api/auth/login` verifies credentials with bcrypt, signs a JWT containing `{sub: userId}` using `jose`, sets it as `peng_session` httpOnly cookie.
2. Server components and route handlers call `getCurrentUser()` from `lib/auth.ts`. It reads the cookie, verifies the JWT, fetches the user from Prisma.
3. Client components consume the auth state via `useAuth()` from `app/providers.tsx`. On mount it calls `/api/auth/me`.
4. Logout: `POST /api/auth/logout` deletes the cookie. Provider sets user to `null` and redirects.

---

## 6. Production deployment (Vercel + Supabase)

When you're ready to go live:

1. In Supabase → Settings → Database → copy the **Transaction pooler** (port 6543) URL.
2. In `prisma/schema.prisma` change `provider = "sqlite"` to `"postgresql"`, add `directUrl = env("DIRECT_URL")` (session pooler, port 5432).
3. In Vercel → Project → Settings → Environment Variables, paste:
   - `DATABASE_URL` (transaction pooler URL)
   - `DIRECT_URL` (session pooler URL)
   - `JWT_SECRET` (generate with `openssl rand -hex 32`)
   - `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_USERNAME`, `ADMIN_DISPLAY_NAME`
   - `NEXT_PUBLIC_BASE_URL` (your Vercel domain)
4. For uploads on Vercel, switch `app/api/upload/route.ts` to write to **Cloudflare R2** or **Supabase Storage** — both have signed-URL flows. (`/app/frontend/.env.example` is the official env template and shows the R2 keys you'll need.)
5. Run `npx prisma db push` once locally pointed at prod, then deploy.

---

## 7. Adding more tracks to the OS audio player

The footer audio player automatically uses any MP3s the user has uploaded via `/api/upload`. If they have none, it falls back to two CC0 sample tracks.

Want a default site-wide playlist? Drop MP3s into `frontend/public/bg/` and edit `components/AudioPlayer/AudioPlayer.tsx` — append the URLs to `FALLBACK_TRACKS` (use `/bg/<filename>.mp3`).
