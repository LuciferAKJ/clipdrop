"use client";
import { useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { registerDevice } from "@/lib/deviceClient";

export function DeviceRegistrar() {
  const { isSignedIn, isLoaded } = useUser();

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      registerDevice();
    }
  }, [isLoaded, isSignedIn]);

  return null;
}