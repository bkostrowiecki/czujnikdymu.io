"use client";

import PocketBase from "pocketbase";
import { createContext, useContext, useRef } from "react";

const PBContext = createContext<PocketBase | null>(null);

export function PocketBaseProvider({
  children,
  pbAuthCookieValue,
}: {
  children: React.ReactNode;
  pbAuthCookieValue?: string;
}) {
  const pbRef = useRef<PocketBase | null>(null);

  if (!pbRef.current) {
    const pb = new PocketBase(
      process.env.NEXT_PUBLIC_POCKETBASE_URL ||
        process.env.NEXT_PUBLIC_PB_URL ||
        "http://127.0.0.1:8090",
    );

    if (pbAuthCookieValue) {
      pb.authStore.loadFromCookie(`pb_auth=${pbAuthCookieValue}`);
    }

    pbRef.current = pb;
  }

  return (
    <PBContext.Provider value={pbRef.current}>{children}</PBContext.Provider>
  );
}

export function usePocketBase() {
  const ctx = useContext(PBContext);
  if (!ctx) throw new Error("Missing PocketBaseProvider");
  return ctx;
}
