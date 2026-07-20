import "@testing-library/jest-dom/vitest";
import { vi, afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

afterEach(() => {
  cleanup();
});

// navigator.clipboard is undefined by default in jsdom — mock it so
// lib/clipboardWatcher.ts's feature-detection branches are exercisable.
Object.defineProperty(navigator, "clipboard", {
  value: {
    readText: vi.fn(),
    writeText: vi.fn(),
  },
  writable: true,
  configurable: true,
});

// jsdom doesn't implement document.hasFocus() by default.
Object.defineProperty(document, "hasFocus", {
  value: vi.fn(() => true),
  writable: true,
});
