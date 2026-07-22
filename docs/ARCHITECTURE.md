# ClipDrop Architecture

## Architecture Overview

ClipDrop is fully serverless: Next.js Route Handlers run as Vercel
functions, Neon Postgres holds all metadata, Cloudinary holds all
binary content, and Clerk handles authentication. There is no
long-running process anywhere — expiration is enforced at read time
plus a daily cron sweep, and cross-device clipboard sync uses
client-side polling rather than a persistent connection, since
serverless functions cannot hold one open.

## Feature Areas

Although `lib/` is currently a flat directory, its files group into
four conceptual feature areas:

**Upload & Sharing**
`codeGen.ts`, `cloudinary.ts`, `password.ts`, `rateLimiter.ts`,
`validation.ts` (share/file rules)

**Device Management**
`deviceClient.ts`, `deviceDisplay.ts`

**Clipboard Sync**
`clipboardSyncClient.ts`, `clipboardWatcher.ts`, `clipboardCompare.ts`,
`syncVisibility.ts`, `textDetection.ts`, `syntaxHighlighterLanguages.ts`

**Cross-cutting**
`prisma.ts`, `apiResponses.ts`, `logger.ts`, `constants.ts`

Note: `clipboardSyncClient.ts` depends on `deviceClient.ts` for
`withClientIdHeader` — this is intentional reuse of device identity by
the clipboard feature, not a layering violation.

## Request Flow (Upload → Share → Receive)

1. Client submits `FormData` to `POST /api/upload` via
   `lib/uploadService.ts` (XHR, for progress events).
2. The route validates input, checks rate limits, generates a unique
   code, uploads files to Cloudinary, writes one `Share` row plus any
   `File` rows.
3. `/s/[code]` calls `GET /api/share/[code]` for metadata (password
   requirement only), then `POST /api/share/[code]` with the password
   to retrieve content — split deliberately so content is never sent
   to a client that hasn't proven it knows the password.
4. Files download directly from Cloudinary's CDN — never proxied
   through the Vercel function.

## Clipboard Sync Flow

`useClipboardSync` polls every 3s while the tab is visible and the
user is signed in, using `pushClipboard`/`pullClipboard`
(`lib/clipboardSyncClient.ts`). Conflict resolution is
timestamp-only — newest `updatedAt` always wins, no merge. Status is
observable read-only via `useClipboardSyncStatus`, backed by
`ClipboardSyncStatusProvider`'s split read/write React contexts.

## Recommended Future Work (not yet executed)

- **Physical folder reorganization** of `lib/` into feature
  subfolders (`lib/device/`, `lib/clipboard/`, `lib/upload/`,
  `lib/shared/`) matching the conceptual grouping above. Deferred
  because it requires updating every import site across the project;
  should be done as its own dedicated, reviewable change with the full
  repository in hand.

## Design Principles

This project follows these engineering principles:

- Prefer minimal changes over broad refactors.
- Avoid premature optimization.
- Keep business logic close to the feature that owns it.
- Favor composition over unnecessary abstraction.
- Optimize only when supported by measurable evidence or profiling.
- Preserve readability and maintainability over theoretical optimizations.
- Avoid speculative refactoring.
- Keep API behavior stable unless fixing a real bug or security issue.
