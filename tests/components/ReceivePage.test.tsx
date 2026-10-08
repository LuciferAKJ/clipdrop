import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ReceivePage from "@/app/s/[code]/page";
import { toast } from "sonner";

vi.mock("next/navigation", () => ({
  useParams: () => ({ code: "CODE123" }),
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
  }),
}));

// Mock LazyTextViewer to render synchronously in tests
vi.mock("@/components/share/LazyTextViewer", () => ({
  LazyTextViewer: ({ text }: { text: string }) => (
    <div data-testid="lazy-text-viewer">{text}</div>
  ),
}));

// Mock Sonner toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

describe("ReceivePage (app/s/[code]/page.tsx) - Crawler & One-Time Protection", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("A. One-time share initial page load: does NOT call POST and does NOT consume the share", async () => {
    const fetchMock = vi
      .fn()
      .mockImplementation((url: string, init?: RequestInit) => {
        if (
          url === "/api/share/CODE123" &&
          (!init || !init.method || init.method === "GET")
        ) {
          return Promise.resolve(
            new Response(
              JSON.stringify({ requiresPassword: false, oneTimeUse: true }),
              { status: 200, headers: { "Content-Type": "application/json" } },
            ),
          );
        }
        return Promise.reject(new Error(`Unexpected fetch call: ${url}`));
      });
    global.fetch = fetchMock;

    render(<ReceivePage />);

    // Expect the reveal screen to appear
    await waitFor(() => {
      expect(screen.getByText("One-Time Share")).toBeInTheDocument();
    });

    expect(
      screen.getByRole("button", { name: /reveal share/i }),
    ).toBeInTheDocument();

    // Verify only GET was called; POST was NEVER called
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const postCalls = fetchMock.mock.calls.filter(
      ([, init]) => init && init.method === "POST",
    );
    expect(postCalls.length).toBe(0);
  });

  it("B. Explicit reveal: clicking 'Reveal Share' performs exactly one POST claim request", async () => {
    const fetchMock = vi
      .fn()
      .mockImplementation((url: string, init?: RequestInit) => {
        if (
          url === "/api/share/CODE123" &&
          (!init || !init.method || init.method === "GET")
        ) {
          return Promise.resolve(
            new Response(
              JSON.stringify({ requiresPassword: false, oneTimeUse: true }),
              { status: 200, headers: { "Content-Type": "application/json" } },
            ),
          );
        }
        if (url === "/api/share/CODE123" && init?.method === "POST") {
          return Promise.resolve(
            new Response(
              JSON.stringify({
                textContent: "Confidential One-Time Note",
                files: [],
              }),
              { status: 200, headers: { "Content-Type": "application/json" } },
            ),
          );
        }
        return Promise.reject(new Error(`Unexpected fetch call: ${url}`));
      });
    global.fetch = fetchMock;

    render(<ReceivePage />);

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /reveal share/i }),
      ).toBeInTheDocument();
    });

    const revealBtn = screen.getByRole("button", { name: /reveal share/i });
    fireEvent.click(revealBtn);

    // After clicking reveal, content should appear
    await waitFor(() => {
      expect(
        screen.getByText("Confidential One-Time Note"),
      ).toBeInTheDocument();
    });

    const postCalls = fetchMock.mock.calls.filter(
      ([, init]) => init && init.method === "POST",
    );
    expect(postCalls.length).toBe(1);
  });

  it("C. Double click / rapid click: only results in one POST claim request", async () => {
    let resolvePost: (value: Response) => void;
    const postPromise = new Promise<Response>((resolve) => {
      resolvePost = resolve;
    });

    const fetchMock = vi
      .fn()
      .mockImplementation((url: string, init?: RequestInit) => {
        if (
          url === "/api/share/CODE123" &&
          (!init || !init.method || init.method === "GET")
        ) {
          return Promise.resolve(
            new Response(
              JSON.stringify({ requiresPassword: false, oneTimeUse: true }),
              { status: 200, headers: { "Content-Type": "application/json" } },
            ),
          );
        }
        if (url === "/api/share/CODE123" && init?.method === "POST") {
          return postPromise;
        }
        return Promise.reject(new Error(`Unexpected fetch call: ${url}`));
      });
    global.fetch = fetchMock;

    render(<ReceivePage />);

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /reveal share/i }),
      ).toBeInTheDocument();
    });

    const revealBtn = screen.getByRole("button", { name: /reveal share/i });

    // Click multiple times rapidly
    fireEvent.click(revealBtn);
    fireEvent.click(revealBtn);
    fireEvent.click(revealBtn);

    const postCalls = fetchMock.mock.calls.filter(
      ([, init]) => init && init.method === "POST",
    );
    expect(postCalls.length).toBe(1);

    // Resolve the promise
    resolvePost!(
      new Response(
        JSON.stringify({
          textContent: "Secret Data",
          files: [],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );

    await waitFor(() => {
      expect(screen.getByText("Secret Data")).toBeInTheDocument();
    });
  });

  it("D. Normal non-one-time share: preserves automatic loading without requiring reveal click", async () => {
    const fetchMock = vi
      .fn()
      .mockImplementation((url: string, init?: RequestInit) => {
        if (
          url === "/api/share/CODE123" &&
          (!init || !init.method || init.method === "GET")
        ) {
          return Promise.resolve(
            new Response(
              JSON.stringify({ requiresPassword: false, oneTimeUse: false }),
              { status: 200, headers: { "Content-Type": "application/json" } },
            ),
          );
        }
        if (url === "/api/share/CODE123" && init?.method === "POST") {
          return Promise.resolve(
            new Response(
              JSON.stringify({
                textContent: "Public Shared Content",
                files: [],
              }),
              { status: 200, headers: { "Content-Type": "application/json" } },
            ),
          );
        }
        return Promise.reject(new Error(`Unexpected fetch call: ${url}`));
      });
    global.fetch = fetchMock;

    render(<ReceivePage />);

    // Content should load automatically without user clicking any reveal button
    await waitFor(() => {
      expect(screen.getByText("Public Shared Content")).toBeInTheDocument();
    });

    expect(screen.queryByText("One-Time Share")).not.toBeInTheDocument();
  });

  it("E. One-time + password: initial load does not consume, wrong password shows error, correct password reveals", async () => {
    const fetchMock = vi
      .fn()
      .mockImplementation((url: string, init?: RequestInit) => {
        if (
          url === "/api/share/CODE123" &&
          (!init || !init.method || init.method === "GET")
        ) {
          return Promise.resolve(
            new Response(
              JSON.stringify({ requiresPassword: true, oneTimeUse: true }),
              { status: 200, headers: { "Content-Type": "application/json" } },
            ),
          );
        }
        if (url === "/api/share/CODE123" && init?.method === "POST") {
          const body = JSON.parse(init.body as string);
          if (body.password === "CorrectPass1") {
            return Promise.resolve(
              new Response(
                JSON.stringify({
                  textContent: "Password Protected Secret",
                  files: [],
                }),
                {
                  status: 200,
                  headers: { "Content-Type": "application/json" },
                },
              ),
            );
          }
          return Promise.resolve(
            new Response(JSON.stringify({ error: "Invalid password" }), {
              status: 401,
              headers: { "Content-Type": "application/json" },
            }),
          );
        }
        return Promise.reject(new Error(`Unexpected fetch call: ${url}`));
      });
    global.fetch = fetchMock;

    render(<ReceivePage />);

    // Initial load: password prompt is shown, POST not called yet
    await waitFor(() => {
      expect(
        screen.getByPlaceholderText(/enter password/i),
      ).toBeInTheDocument();
    });
    expect(
      screen.getByText(/password-protected one-time share/i),
    ).toBeInTheDocument();

    const postCallsInitial = fetchMock.mock.calls.filter(
      ([, init]) => init && init.method === "POST",
    );
    expect(postCallsInitial.length).toBe(0);

    const input = screen.getByPlaceholderText(/enter password/i);
    const unlockBtn = screen.getByRole("button", {
      name: /unlock & reveal share/i,
    });

    // Attempt 1: wrong password
    fireEvent.change(input, { target: { value: "WrongPass" } });
    fireEvent.click(unlockBtn);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Invalid password");
    });

    // Content should NOT be revealed
    expect(
      screen.queryByText("Password Protected Secret"),
    ).not.toBeInTheDocument();

    // Attempt 2: correct password
    fireEvent.change(input, { target: { value: "CorrectPass1" } });
    fireEvent.click(unlockBtn);

    await waitFor(() => {
      expect(screen.getByText("Password Protected Secret")).toBeInTheDocument();
    });
  });

  it("F. Expired or already consumed share: displays error state cleanly", async () => {
    const fetchMock = vi
      .fn()
      .mockImplementation((url: string, init?: RequestInit) => {
        if (
          url === "/api/share/CODE123" &&
          (!init || !init.method || init.method === "GET")
        ) {
          return Promise.resolve(
            new Response(JSON.stringify({ error: "Download limit reached" }), {
              status: 410,
              headers: { "Content-Type": "application/json" },
            }),
          );
        }
        return Promise.reject(new Error(`Unexpected fetch call: ${url}`));
      });
    global.fetch = fetchMock;

    render(<ReceivePage />);

    await waitFor(() => {
      expect(screen.getByText("Download limit reached")).toBeInTheDocument();
    });

    const postCalls = fetchMock.mock.calls.filter(
      ([, init]) => init && init.method === "POST",
    );
    expect(postCalls.length).toBe(0);
  });
});
