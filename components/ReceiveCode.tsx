"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function ReceiveCode() {
  const [code, setCode] = useState("");
  const router = useRouter();

  function handleOpen() {
    if (!code.trim()) return;

    router.push(`/s/${code.trim().toUpperCase()}`);
  }

  return (
    <div className="space-y-3">
      <h2 className="text-xl font-semibold">
        Receive a Share
      </h2>

      <p className="text-sm text-muted-foreground">
        Enter the code you received
      </p>

      <Input
        placeholder="Enter code e.g. B7ZSJF"
        value={code}
        onChange={(e) => setCode(e.target.value)}
      />

      <Button
        onClick={handleOpen}
        className="w-full"
      >
        Open Share
      </Button>
    </div>
  );
}