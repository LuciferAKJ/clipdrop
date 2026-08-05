import { UploadZone } from "@/components/UploadZone";
import { ReceiveCode } from "@/components/ReceiveCode";
import { Show, SignInButton, UserButton } from "@clerk/nextjs";
import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-16">
      <div className="mb-12 flex justify-end">
        <Show when="signed-out">
          <SignInButton mode="modal">
            <button className="rounded border px-3 py-1 text-sm hover:bg-muted">
              Sign In
            </button>
          </SignInButton>
        </Show>

        <Show when="signed-in">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Dashboard
            </Link>

            <UserButton />
          </div>
        </Show>
      </div>

      <div className="mb-14 text-center">
        <span className="inline-flex rounded-full border px-4 py-1 text-sm text-muted-foreground">
          Secure • Fast • Temporary
        </span>

        <h1 className="mt-6 text-5xl font-extrabold tracking-tight">
          Share Files &<span className="text-primary"> Text</span>
          <br />
          Instantly
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
          Share documents, images, code, archives and notes securely with
          passwords, download limits and automatic expiry.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <UploadZone />
        <ReceiveCode />
      </div>

      <div className="mt-16 grid gap-6 md:grid-cols-3">
        <div className="rounded-xl border p-6">
          <h3 className="font-semibold">🔒 Secure Sharing</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Password protection, automatic expiry and download limits keep your
            shared content under control.
          </p>
        </div>

        <div className="rounded-xl border p-6">
          <h3 className="font-semibold">⚡ Fast Uploads</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Share files, images, code and documents in seconds with a simple
            six-character code.
          </p>
        </div>

        <div className="rounded-xl border p-6">
          <h3 className="font-semibold">☁ Cloud Powered</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Files are stored securely and automatically removed when they
            expire.
          </p>
        </div>
      </div>
    </main>
  );
}
