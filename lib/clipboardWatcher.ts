/**
 * Thin wrapper around the browser Clipboard API. No polling, no React,
 * no throwing — every failure mode (unsupported browser, denied
 * permission, insecure context) resolves to null/false rather than
 * propagating an exception, since clipboard access is inherently
 * best-effort and the caller (useClipboardSync) must keep running
 * regardless of whether a given read/write succeeds.
 */

export async function readClipboard(): Promise<string | null> {
  try {
    if (typeof navigator === "undefined" || !navigator.clipboard?.readText) {
      return null;
    }
    const text = await navigator.clipboard.readText();
    return text;
  } catch {
    return null;
  }
}

export async function writeClipboard(text: string): Promise<boolean> {
  try {
    if (typeof navigator === "undefined" || !navigator.clipboard?.writeText) {
      return false;
    }
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
