import { NextResponse } from "next/server";

/**
 * Reusable, consistently-shaped API responses. All error responses use
 * the same { error: string } JSON envelope so client-side error
 * handling (toast messages, etc.) never has to branch on response shape.
 */

export function unauthorized(message = "Unauthorized") {
  return NextResponse.json({ error: message }, { status: 401 });
}

export function forbidden(message = "Forbidden") {
  return NextResponse.json({ error: message }, { status: 403 });
}

export function notFound(message = "Not found") {
  return NextResponse.json({ error: message }, { status: 404 });
}

export function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

export function tooManyRequests(
  message = "Too many requests — please slow down",
) {
  return NextResponse.json({ error: message }, { status: 429 });
}

export function serverError(message = "Internal server error") {
  return NextResponse.json({ error: message }, { status: 500 });
}

export function noContent() {
  return new NextResponse(null, { status: 204 });
}

export function ok<T extends object>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

/**
 * Wraps a route handler body, converting unexpected thrown errors into
 * a consistent 500 response and logging them, instead of letting each
 * handler repeat its own try/catch/serverError boilerplate.
 */
export async function withErrorHandling<T>(
  fn: () => Promise<T>,
  logger: { error: (msg: string, err: unknown) => void },
): Promise<T | ReturnType<typeof serverError>> {
  try {
    return await fn();
  } catch (err) {
    logger.error("Unhandled route error", err);
    return serverError();
  }
}
