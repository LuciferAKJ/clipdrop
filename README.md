# ClipDrop

A temporary clipboard and file-sharing service for instantly transferring text and files between devices — plus optional cross-device clipboard sync for authenticated users.

## Technology Stack

- **Frontend**: Next.js (App Router), React, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Next.js Route Handlers, Prisma ORM
- **Database**: Neon PostgreSQL (free tier)
- **File Storage**: Cloudinary (free tier)
- **Auth**: Clerk
- **Deployment**: Vercel (free tier), serverless-only — no persistent servers, no Redis, no Docker
- **Testing**: Vitest + Testing Library (unit/component), Playwright (e2e)

## Features

- Drag-and-drop or paste-based upload of text and files
- Short share codes and shareable links (`/s/CODE`)
- Configurable expiration, one-time downloads, password protection
- Markdown and syntax-highlighted code preview on the receive page
- Upload progress with cancellation support
- Authenticated dashboard: upload history, per-share management
- Device management: automatic device registration, rename, remove
- Cross-device clipboard sync (polling-based, visibility-aware, conflict-resolved by latest-timestamp-wins)

## Installation

```bash
git clone <repo-url>
cd clipdrop
npm install
```

## Environment Variables

Create `.env.local`:

```
DATABASE_URL=""
DIRECT_URL=""
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=""
CLERK_SECRET_KEY=""
CLERK_WEBHOOK_SECRET=""
CLOUDINARY_CLOUD_NAME=""
CLOUDINARY_API_KEY=""
CLOUDINARY_API_SECRET=""
IP_HASH_PEPPER=""
CRON_SECRET=""
```

## Development

```bash
npm run dev
```

## Testing

```bash
npm run test           # unit + API + component tests
npm run test:coverage  # with coverage report
npm run test:e2e       # Playwright end-to-end tests
```

## Production Build

```bash
npm run build
npm run start
```

## Clipboard Sync

Authenticated devices poll `/api/clipboard` every 3 seconds while the tab is visible. Pushing a new local clipboard value and pulling a newer server value are mutually exclusive per tick; conflicts are resolved by whichever push reaches the server last (highest `updatedAt` wins) — there is no merge logic. See `hooks/useClipboardSync.ts`.

## Device Sync

Each browser generates a persistent `clientId` (`localStorage`) and registers once per session against the authenticated user via `POST /api/devices`. Manage registered devices at `/dashboard/devices`.

## Deployment

Deploys to Vercel's free tier. Required: Neon Postgres connection strings, Cloudinary credentials, Clerk keys + webhook secret, and a `CRON_SECRET` matching the cron job configured in `vercel.json` (daily expired-share cleanup).

## Architecture

Fully serverless: Next.js Route Handlers on Vercel, Neon Postgres for metadata, Cloudinary for binary storage, Clerk for auth. No background workers — expiration is enforced at read time plus a daily cron sweep; clipboard sync uses client-side polling rather than persistent connections, since Vercel serverless functions can't hold one open.

## Folder Structure

```
app/                 Next.js App Router pages and API routes
components/          UI components (dashboard, devices, share, providers)
lib/                 Business logic, validation, clients, utilities
hooks/               React hooks (clipboard sync, sync status)
prisma/              Schema and migrations
tests/               Unit, hook, component, and API tests
e2e/                 Playwright end-to-end tests
```

## License

[Add your chosen license here]
