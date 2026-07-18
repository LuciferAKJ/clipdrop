import { UploadZone } from "@/components/UploadZone";
import { ReceiveCode } from "@/components/ReceiveCode";
import {
  Show,
  SignInButton,
  UserButton,
} from "@clerk/nextjs";
import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto max-w-xl px-4 py-16">
      <div className="flex justify-end mb-6">
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
      <h1 className="text-4xl font-bold mb-3">
        ClipDrop
      </h1>

      <p className="text-muted-foreground mb-8">
        Share text and files instantly. Expires automatically.
      </p>


      <UploadZone />


      <div className="my-8 border-t" />


      <ReceiveCode />


    </main>
  );
}