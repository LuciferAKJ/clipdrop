/**
 * Pure comparison helpers for clipboard synchronization. No side
 * effects, no browser/React dependencies — safe to unit test in
 * isolation and safe to call from any layer.
 */

export function isClipboardEqual(
  a: string | null | undefined,
  b: string | null | undefined,
): boolean {
  const trimmedA = (a ?? "").trim();
  const trimmedB = (b ?? "").trim();
  return trimmedA === trimmedB;
}

/**
 * True if remoteUpdatedAt is strictly newer than lastKnownUpdatedAt.
 * If we have no prior known timestamp, the remote value is treated as
 * newer by definition (nothing to compare against yet).
 */
export function isRemoteNewer(
  remoteUpdatedAt: string,
  lastKnownUpdatedAt: string | null,
): boolean {
  if (!lastKnownUpdatedAt) return true;
  return (
    new Date(remoteUpdatedAt).getTime() > new Date(lastKnownUpdatedAt).getTime()
  );
}
