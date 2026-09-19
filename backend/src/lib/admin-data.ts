"use client";

// One-shot admin data layer.
//
// The admin panel used live `useQuery` subscriptions on full-table queries.
// Convex re-runs every open subscription on every write, so importing 500
// questions re-read (and re-sent) the whole questions/tests/attempts tables
// 500 times — that is where the database bandwidth went.
//
// Here a query runs once per mount and again only when something is actually
// written (or the tab regains focus). Same screens, same freshness, without a
// re-read per keystroke of a bulk import.
import { useCallback, useEffect, useState } from "react";
import { ConvexHttpClient } from "convex/browser";
import {
  FunctionArgs,
  FunctionReference,
  FunctionReturnType,
} from "convex/server";

const CONVEX_URL =
  process.env.NEXT_PUBLIC_CONVEX_URL ?? "https://capable-gazelle-597.convex.cloud";

export const adminHttp = new ConvexHttpClient(CONVEX_URL);

const listeners = new Set<() => void>();

/** Re-run every mounted admin query — called after any admin mutation. */
export function refreshAdminData() {
  listeners.forEach((l) => l());
}

export function useOnce<Query extends FunctionReference<"query">>(
  ref: Query,
  args?: FunctionArgs<Query> | "skip"
): FunctionReturnType<Query> | undefined {
  const [data, setData] = useState<FunctionReturnType<Query> | undefined>(undefined);
  const argsKey = args === "skip" ? "skip" : JSON.stringify(args ?? {});

  const load = useCallback(() => {
    if (argsKey === "skip") {
      setData(undefined);
      return;
    }
    adminHttp
      .query(ref, JSON.parse(argsKey))
      .then((d) => setData(d as FunctionReturnType<Query>))
      .catch(() => setData(undefined));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [argsKey]);

  useEffect(() => {
    load();
    listeners.add(load);
    const onFocus = () => load();
    window.addEventListener("focus", onFocus);
    return () => {
      listeners.delete(load);
      window.removeEventListener("focus", onFocus);
    };
  }, [load]);

  return data;
}

/** Mutation wrapper that refreshes the open queries once the write lands. */
export function useAdminMutation<Mutation extends FunctionReference<"mutation">>(
  ref: Mutation
) {
  return useCallback(
    async (args?: FunctionArgs<Mutation>): Promise<FunctionReturnType<Mutation>> => {
      const result = await adminHttp.mutation(ref, args ?? ({} as FunctionArgs<Mutation>));
      refreshAdminData();
      return result;
    },
    [ref]
  );
}

/**
 * One-shot paginated read. Same "load more" behaviour as Convex's
 * usePaginatedQuery, but the loaded pages are NOT kept subscribed — an admin
 * who has scrolled through 1,000 questions no longer receives all of them
 * again on every write.
 */
export function usePagedOnce<Row>(
  ref: FunctionReference<"query">,
  args: Record<string, unknown>,
  pageSize = 50
) {
  const [rows, setRows] = useState<Row[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(true);
  const argsKey = JSON.stringify(args);

  const fetchPage = useCallback(
    async (from: string | null, replace: boolean) => {
      setLoading(true);
      try {
        const res = (await adminHttp.query(ref, {
          ...JSON.parse(argsKey),
          paginationOpts: { numItems: pageSize, cursor: from },
        })) as { page: Row[]; isDone: boolean; continueCursor: string };
        setRows((prev) => (replace ? res.page : [...prev, ...res.page]));
        setCursor(res.continueCursor);
        setDone(res.isDone);
      } catch {
        if (replace) setRows([]);
      }
      setLoading(false);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [argsKey, pageSize]
  );

  const reload = useCallback(() => {
    setCursor(null);
    setDone(false);
    void fetchPage(null, true);
  }, [fetchPage]);

  useEffect(() => {
    reload();
    listeners.add(reload);
    return () => {
      listeners.delete(reload);
    };
  }, [reload]);

  return {
    rows,
    loading,
    isDone: done,
    loadMore: () => {
      if (!done && !loading) void fetchPage(cursor, false);
    },
    reload,
  };
}
