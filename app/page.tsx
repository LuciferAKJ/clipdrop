import { UploadZone } from "@/components/UploadZone";
import { ReceiveCode } from "@/components/ReceiveCode";

export default function Home() {
  return (
    <main className="mx-auto max-w-xl px-4 py-16">

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