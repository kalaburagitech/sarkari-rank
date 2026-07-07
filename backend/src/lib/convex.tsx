"use client";

import { ConvexProvider, ConvexReactClient } from "convex/react";
import { ReactNode, useMemo } from "react";

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL ?? "https://hardy-leopard-835.convex.cloud";

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  const client = useMemo(() => new ConvexReactClient(CONVEX_URL), []);
  return <ConvexProvider client={client}>{children}</ConvexProvider>;
}

export function ConvexConnectionBanner() {
  if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
    return (
      <div className="bg-red-600 text-white text-center py-2 text-sm font-medium">
        ⚠ NEXT_PUBLIC_CONVEX_URL missing in .env.local
      </div>
    );
  }
  return null;
}
