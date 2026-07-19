/**
 * The Device.name field currently stores a combined "Browser on OS"
 * label (see guessDeviceName in deviceClient.ts). This just splits it
 * back out for two-line display; purely presentational, not stored
 * separately, so it degrades gracefully for any name that doesn't
 * match the "X on Y" shape (e.g. a user-renamed device).
 */
export function splitDeviceLabel(name: string): { primary: string; secondary: string | null } {
  const match = /^(.+) on (.+)$/.exec(name);
  if (match) {
    return { primary: match[1], secondary: match[2] };
  }
  return { primary: name, secondary: null };
}