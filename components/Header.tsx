"use client";

import Link from "next/link";
import { Show, SignInButton, UserButton } from "@clerk/nextjs";

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link
          href="/"
          className="text-lg font-bold tracking-tight transition-opacity hover:opacity-80"
        >
          ClipDrop
        </Link>

        <nav className="flex items-center gap-6">
          <Link
            href="/"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Home
          </Link>

          <Show when="signed-in">
            <>
              <Link
                href="/dashboard"
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                Dashboard
              </Link>

              <Link
                href="/dashboard/devices"
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                Devices
              </Link>

              <UserButton />
            </>
          </Show>

          <Show when="signed-out">
            <SignInButton mode="modal">
              <button className="rounded-lg border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted">
                Sign In
              </button>
            </SignInButton>
          </Show>
        </nav>
      </div>
    </header>
  );
}
