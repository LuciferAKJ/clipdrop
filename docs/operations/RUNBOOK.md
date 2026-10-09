# ClipDrop Production Operations Runbook

This runbook outlines operational procedures, incident triage, and maintenance workflows for ClipDrop.

---

## 1. Architecture & Hosting Topology

ClipDrop is a fully serverless Next.js application deployed on **Vercel** with the following managed cloud services:

- **Compute / Hosting**: Vercel Serverless Functions (Node.js runtime).
- **Relational Database**: Neon Serverless PostgreSQL (`@prisma/client` + `@prisma/adapter-neon`).
- **Binary File Storage**: Cloudinary (uploaded via secure API, served directly via Cloudinary CDN URLs).
- **Authentication**: Clerk (User accounts, sessions, and organizations).
- **Background Maintenance**: Automated cron invocations to `/api/cron/cleanup` via Vercel Cron.

---

## 2. Required Environment Variables

All secrets and configuration parameters must be set in the deployment platform (e.g., Vercel Project Settings > Environment Variables). **Never commit secret values to version control.**

| Variable Name                       | Required Scope         | Purpose / Description                                                                  |
| ----------------------------------- | ---------------------- | -------------------------------------------------------------------------------------- |
| `DATABASE_URL`                      | Build & Runtime        | Connection pooled PostgreSQL connection string for Prisma.                             |
| `DIRECT_URL`                        | Build & Migration      | Direct PostgreSQL connection string for Prisma migrations/schema engines.              |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Build & Client Runtime | Clerk public publishable frontend API key (`pk_...`).                                  |
| `CLERK_SECRET_KEY`                  | Server Runtime         | Clerk backend private secret key (`sk_...`).                                           |
| `CLERK_WEBHOOK_SECRET`              | Server Runtime         | Svix webhook signing secret for verifying Clerk user event webhooks (`whsec_...`).     |
| `CLOUDINARY_CLOUD_NAME`             | Server Runtime         | Cloudinary cloud account name.                                                         |
| `CLOUDINARY_API_KEY`                | Server Runtime         | Cloudinary REST API public key identifier.                                             |
| `CLOUDINARY_API_SECRET`             | Server Runtime         | Cloudinary REST API private signing secret.                                            |
| `IP_HASH_PEPPER`                    | Server Runtime         | Secret high-entropy string used to salt anonymized client IP hashes for rate limiting. |
| `CRON_SECRET`                       | Server Runtime         | Secret bearer token required to authenticate requests to `/api/cron/cleanup`.          |
| `NEXT_PUBLIC_APP_URL`               | Build & Client Runtime | Public domain canonical URL (e.g., `https://clipdrop.yourdomain.com`).                 |
| `E2E_TEST_EMAIL`                    | CI / Testing Only      | Dedicated test account email for running authenticated Playwright E2E suites in CI.    |
| `E2E_TEST_PASSWORD`                 | CI / Testing Only      | Dedicated test account password for running authenticated Playwright E2E suites in CI. |

---

## 3. Production Deployment & Verification

### A. Pre-Deployment Verification

Before deploying to production:

1. Run local test and lint checks:
   ```bash
   npm run lint
   npx tsc --noEmit
   npm test
   npm run build
   npm run test:e2e:public
   ```
2. Verify that Prisma migrations are synchronized with Neon PostgreSQL:
   ```bash
   npx prisma migrate status
   ```

### B. Post-Deployment Smoke Test

Perform a live verification immediately after a deployment:

1. **Homepage (`/`)**: Verify title, Transit badge, UploadZone, Receive Code card, and FAQ accordion render.
2. **Anonymous Upload (`POST /api/upload`)**: Upload a text snippet or sample test file; confirm that a 6-digit code is returned.
3. **Receive Flow (`/s/[code]`)**: Navigate to the generated URL, verify content loads or triggers correct password/reveal gates, and confirm download counts decrement or increment accordingly.
4. **Invalid Code Handling**: Navigate to `/s/NONEXISTENT999`; confirm the "Share not found" error card renders safely without 500 crashes.
5. **Privacy Page (`/privacy`)**: Verify policy renders and links navigate back to Home.

---

## 4. Rollback Procedures

If a faulty build or runtime regression is detected in production:

### Instant Vercel Rollback

1. Open the **Vercel Dashboard** > **Project** > **Deployments**.
2. Locate the previous known-good deployment (e.g., commit `5c6cf01` / release tag `v1.0.0`).
3. Click the deployment menu (**...**) and select **Promote to Production** (or **Instant Rollback**).
4. Verify the active production domain points to the restored deployment.

### Git Tag Recovery

If deploying via Git branch triggers:

```bash
git checkout main
git revert HEAD --no-edit
git push origin main
```

---

## 5. Scheduled Maintenance & Cron Cleanup

### Expected Operation

- A scheduled cron triggers `GET /api/cron/cleanup` with header `Authorization: Bearer <CRON_SECRET>`.
- The endpoint performs:
  1. Identification of shares where `expiresAt < now()`, or `consumedAt IS NOT NULL`, or `downloadCount >= downloadLimit`.
  2. Cloudinary asset removal for all attached files in batch.
  3. Cascading database deletion of expired `Share` and `File` records.
  4. Cleanup of orphaned device registrations (`lastSeenAt > 30 days`).

### Investigating Cleanup Failures

1. **401 Unauthorized**:
   - Check if `CRON_SECRET` in Vercel Environment Variables matches the token configured in the cron caller (or `vercel.json`).
2. **Cloudinary Asset Cleanup Retries**:
   - Cloudinary deletion errors are logged via `logger.error("Cloudinary deletion failed", ...)`.
   - If Cloudinary rate limits or temporary connection issues occur, the database records remain until the next cron run for resilient retry.
3. **Manual Trigger**:
   An authorized maintainer can manually trigger cleanup:
   ```bash
   curl -X GET "https://<app-domain>/api/cron/cleanup" \
     -H "Authorization: Bearer <CRON_SECRET>"
   ```
   Expected response: `200 OK` with JSON `{ "deletedShares": N, "deletedFiles": M, "deletedDevices": D }`.

---

## 6. Authentication & Clerk Webhook Health

### Clerk Configuration Checklist (Dashboard)

- [ ] **Clerk Dashboard > Webhooks**: Endpoint set to `https://<app-domain>/api/webhooks/clerk`.
- [ ] **Subscribed Events**: `user.created`, `user.updated`, `user.deleted`.
- [ ] **Signing Secret**: Copied to `CLERK_WEBHOOK_SECRET` in Vercel.

### Webhook Failure Triage

If users report authentication or account sync discrepancies:

1. Check Vercel Function logs for `/api/webhooks/clerk`.
2. Verify Svix signature headers: `svix-id`, `svix-timestamp`, `svix-signature`.
3. If signature verification fails (HTTP 400), verify that `CLERK_WEBHOOK_SECRET` is set correctly and has no trailing whitespace.

---

## 7. Database Backups & Infrastructure Resilience

### Neon PostgreSQL Verification (Manual Checklist)

Neon provides continuous write-ahead log (WAL) archiving and point-in-time recovery (PITR).

- [ ] **Neon Console > Project > Branches**: Ensure main branch is active and healthy.
- [ ] **Neon Console > Backups / PITR**: Verify point-in-time restore is available for the retention window.
- [ ] **Connection Limits**: Ensure `@prisma/adapter-neon` or connection pooling (`DATABASE_URL` with pooled endpoint) is utilized to prevent connection exhaustion under burst traffic.

---

## 8. Logs & Incident Triage

Structured JSON logs are emitted via `lib/logger.ts` and captured by Vercel Runtime Logs:

- **`[error]` Logs**: Check for upload validation errors, Cloudinary upload/delete failures, or database query exceptions.
- **`[warn]` Logs**: Check for rate-limiting triggers (`429 Too Many Requests`) or expired share access attempts.
- **Incident Escalation**:
  1. Check Vercel Status and Neon Status.
  2. Check Cloudinary API Status.
  3. Check Clerk Service Status.

---

## 9. Dependency & Security Alert Review

1. Review Dependabot and GitHub Security Advisories weekly:
   - Development CLI tooling advisories (e.g., `shadcn`, `prisma` CLI parser) do NOT impact runtime production safety.
   - Production runtime dependencies are tracked and audited with zero High/Critical vulnerabilities.
2. When updating packages:
   - Run `npm audit --json` to verify affected graph.
   - Run full Vitest suite (`npm test`) and Playwright smoke suite (`npm run test:e2e:public`).
   - Never use `npm audit fix --force`.

---

## 10. Configuring Authenticated CI E2E Tests

To enable the full authenticated Playwright test suite in GitHub Actions:

1. Navigate to **GitHub Repository** > **Settings** > **Secrets and variables** > **Actions**.
2. Add the following repository secrets:
   - `E2E_TEST_EMAIL`: The login email for a dedicated, sandboxed Clerk test account.
   - `E2E_TEST_PASSWORD`: The password for the dedicated test account.
3. When these secrets are present, `e2e/auth.setup.ts` will authenticate against Clerk during CI runs and execute `upload-and-share`, `device-management`, `clipboard-sync`, and `offline-recovery` specs.
4. When secrets are absent, the public smoke suite runs automatically while authenticated tests are cleanly marked as skipped.
