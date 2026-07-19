const CLIENT_ID_KEY = "clipdrop_client_id";
const SESSION_REGISTERED_KEY = "clipdrop_device_registered";

/**
 * Returns the persistent client ID for this browser.
 * Generates and stores one on first use.
 */
export function getOrCreateClientId(): string {
  if (typeof window === "undefined") return "";

  let clientId = localStorage.getItem(CLIENT_ID_KEY);

  if (!clientId) {
    clientId = crypto.randomUUID();
    localStorage.setItem(CLIENT_ID_KEY, clientId);
  }

  return clientId;
}

/**
 * Returns the current browser's client ID if it exists.
 * Does not generate a new one.
 */
export function getCurrentClientId(): string | null {
  if (typeof window === "undefined") return null;

  return localStorage.getItem(CLIENT_ID_KEY);
}

/**
 * Attaches the current client ID as an HTTP header.
 * Used by authenticated device-related API requests.
 */
export function withClientIdHeader(
  headers: HeadersInit = {}
): HeadersInit {
  const clientId = getCurrentClientId();

  return {
    ...headers,
    ...(clientId ? { "x-client-id": clientId } : {}),
  };
}

function guessDeviceName(): string {
  if (typeof navigator === "undefined") {
    return "Unknown device";
  }

  const ua = navigator.userAgent;

  const browser = /Edg/i.test(ua)
    ? "Edge"
    : /Chrome/i.test(ua)
    ? "Chrome"
    : /Firefox/i.test(ua)
    ? "Firefox"
    : /Safari/i.test(ua)
    ? "Safari"
    : "Browser";

  const os = /Windows/i.test(ua)
    ? "Windows"
    : /Mac OS/i.test(ua)
    ? "Mac"
    : /Android/i.test(ua)
    ? "Android"
    : /iPhone|iPad/i.test(ua)
    ? "iOS"
    : /Linux/i.test(ua)
    ? "Linux"
    : "Unknown OS";

  return `${browser} on ${os}`;
}

/**
 * Registers this browser as a device for the authenticated user.
 * Runs only once per browser session.
 *
 * Registration failures never block the application.
 */
export async function registerDevice(): Promise<void> {
  if (typeof window === "undefined") return;

  if (sessionStorage.getItem(SESSION_REGISTERED_KEY) === "true") {
    return;
  }

  const clientId = getOrCreateClientId();

  if (!clientId) return;

  try {
    const res = await fetch("/api/devices", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...withClientIdHeader(),
      },
      body: JSON.stringify({
        clientId,
        name: guessDeviceName(),
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));

      console.error(
        "Device registration failed:",
        data.error || res.statusText
      );

      return;
    }

    sessionStorage.setItem(SESSION_REGISTERED_KEY, "true");
  } catch (err) {
    console.error("Device registration request failed:", err);
  }
}