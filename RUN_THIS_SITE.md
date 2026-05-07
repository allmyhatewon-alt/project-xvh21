# Pengelus live site runbook

This is the straight path from local preview to a real public site.

## Current local setup

- App root: `C:\Users\swoon\Downloads\workingon-main\frontend`
- Local URL: `http://127.0.0.1:3000`
- Dev command: `npm run dev`
- Database: SQLite at `frontend/prisma/dev.db`
- Admin login: use the values in `frontend/.env`

## What has to be real before public launch

1. Domain
   - Point `pengelus.me` to the production frontend.
   - Keep `NEXT_PUBLIC_BASE_URL` and `NEXTAUTH_URL` set to the final HTTPS domain.

2. Database
   - Local SQLite is good for building.
   - Production should use Postgres, preferably Supabase or Neon.
   - Move `DATABASE_URL` to the hosted Postgres connection string before launch.

3. Auth secrets
   - Generate a real `JWT_SECRET` / `NEXTAUTH_SECRET`.
   - Never reuse the local dev secret on production.

4. Uploads and media
   - Local uploads live on disk and will disappear on most hosts.
   - Use Bunny Storage, Cloudflare R2, Supabase Storage, or another object store for public uploads.

5. Streaming bandwidth
   - Native browser streaming is good for testing and small rooms.
   - For heavy playback, use Bunny Stream or Bunny CDN-backed HLS.
   - Bunny Stream does not take RTMP live ingest directly, so true Twitch-style ingest still needs a media server or a live provider.

## Bunny Stream setup

Use Bunny for replays, uploaded stream clips, pre-recorded premieres, and CDN-backed HLS/MP4 playback.

Environment variables:

```env
BUNNY_STREAM_LIBRARY_ID=
BUNNY_STREAM_API_KEY=
BUNNY_STREAM_PLAYER_BASE=https://player.mediadelivery.net/embed
BUNNY_STREAM_CDN_HOSTNAME=
BUNNY_STREAM_PULL_ZONE=
```

In Open Studio, choose `bunny` as the stream type. The source field accepts:

- `libraryId/videoId`
- `videoId` by itself if `BUNNY_STREAM_LIBRARY_ID` is set
- `https://player.mediadelivery.net/embed/libraryId/videoId`
- a Bunny CDN `.m3u8` HLS URL
- a Bunny CDN `.mp4` URL
- a CDN path like `/streams/peng/index.m3u8` if `BUNNY_STREAM_CDN_HOSTNAME` is set

The app will normalize Bunny library/video values into:

```text
https://player.mediadelivery.net/embed/{libraryId}/{videoId}?autoplay=true&muted=false&preload=true&responsive=true
```

## Best production streaming stack

For the first real public version:

1. Keep Pengelus native WebRTC for small creator rooms and testing.
2. Use Bunny Stream for VOD, clips, saved lives, and featured videos.
3. Add a dedicated live ingest service next if you want real OBS-style streaming.

The serious live path should look like this:

```text
OBS / browser studio -> ingest server -> HLS output -> Bunny CDN -> Pengelus live page
```

Good ingest server options:

- OvenMediaEngine: best fit for WebRTC plus LL-HLS.
- MediaMTX: lightweight RTSP/RTMP/WebRTC/HLS router. This is the recommended first step for Pengelus.
- NGINX RTMP: simpler, older, good enough for RTMP to HLS.
- Mux Live or Cloudflare Stream Live: easiest managed option, higher cost.

## MediaMTX setup

Pengelus now has a `mediamtx` stream type in Open Studio. Use it when you want a real ingest server between OBS/browser streaming and the Pengelus live room.

Local config files:

- `streaming/mediamtx.yml`
- `streaming/docker-compose.mediamtx.yml`

Local ports:

- RTMP ingest: `rtmp://127.0.0.1:1935/{streamPath}`
- HLS browser playback: `http://127.0.0.1:8888/{streamPath}`
- HLS playlist: `http://127.0.0.1:8888/{streamPath}/index.m3u8`
- WebRTC browser playback: `http://127.0.0.1:8889/{streamPath}`
- MediaMTX API: `http://127.0.0.1:9997`

OBS local test:

```text
Service: Custom
Server: rtmp://127.0.0.1:1935
Stream Key: peng
```

Then in Pengelus Open Studio:

```text
Stream type: mediamtx
MediaMTX stream path: peng
```

Pengelus will turn `peng` into `http://127.0.0.1:8888/peng?muted=false&autoplay=true&playsInline=true` by default.

For production, put MediaMTX on a VPS or container host, then set:

```env
MEDIAMTX_HLS_URL=https://live.pengelus.me
MEDIAMTX_WEBRTC_URL=https://webrtc.pengelus.me
MEDIAMTX_RTMP_URL=rtmp://ingest.pengelus.me:1935
MEDIAMTX_PLAYBACK_PROTOCOL=hls
```

Keep Bunny in the stack for replays, clips, and CDN-backed saved lives. MediaMTX handles ingest; Bunny handles storage/CDN playback after the stream is saved or restreamed.

## Recommended launch plan

Phase 1:

- Host frontend/API.
- Move DB to Postgres.
- Keep Bunny provider for VOD/HLS.
- Keep native live for testing.
- Add creator upload-to-Bunny flow for replays.

Phase 2:

- Add real ingest keys per creator.
- Add stream health, bitrate, latency, reconnect state.
- Auto-save live sessions as Bunny replays.
- Put chat, gifts, overlays, and TTS on the live room.

Phase 3:

- Ship a small desktop studio app for creators.
- It should handle camera/screen/audio scenes, overlays, stream key management, and one-click go-live.

## Should Pengelus have an app?

Yes, but not before the web version is stable.

The website should stay the main platform because everyone can open it instantly. The app should be a creator tool, not the whole product at first. Build it after live rooms, chat, gifts, Bunny playback, and account systems are solid.

The app should be called something like `Peng Studio`, and its job should be:

- Go live without browser permission weirdness.
- Save scenes and overlay layouts.
- Manage stream keys safely.
- Test mic/camera before going live.
- Show chat, gifts, TTS, and alerts in one creator dashboard.

## Pre-launch checklist

- `npm run build` passes.
- `npx prisma db push` has run against production DB.
- `JWT_SECRET` and `NEXTAUTH_SECRET` are production-only.
- Admin login works on the production domain.
- `/api/auth/me`, `/api/live`, `/api/chat`, and `/api/upload` work on HTTPS.
- Bunny playback works with a real video library/video ID.
- No API keys are exposed in client-side code.
- A test user can sign up, edit profile, open studio, create a stream, chat, and view a live page.
