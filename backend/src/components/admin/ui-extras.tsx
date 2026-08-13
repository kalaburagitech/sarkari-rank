"use client";

import { useState, useEffect } from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import * as Dialog from "@radix-ui/react-dialog";
import { MoreVertical, Search, ChevronRight, ChevronLeft, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/admin/ui";

// ─── Breadcrumbs ─────────────────────────────────────────────
export type Crumb = { label: string; onClick?: () => void };

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav className="flex items-center flex-wrap gap-1 text-sm text-slate-500 mb-4">
      {items.map((c, i) => (
        <span key={i} className="flex items-center gap-1">
          {i > 0 && <ChevronRight size={14} className="text-slate-300" />}
          {c.onClick && i < items.length - 1 ? (
            <button
              onClick={c.onClick}
              className="hover:text-indigo-600 transition-colors font-medium"
            >
              {c.label}
            </button>
          ) : (
            <span
              className={cn(
                i === items.length - 1 ? "text-slate-900 font-semibold" : "font-medium"
              )}
            >
              {c.label}
            </span>
          )}
        </span>
      ))}
    </nav>
  );
}

// ─── Three-dot Action Menu ───────────────────────────────────
export type ActionItem = {
  label: string;
  icon?: React.ElementType;
  onClick: () => void;
  danger?: boolean;
};

export function ActionMenu({ items }: { items: ActionItem[] }) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors outline-none"
          aria-label="Actions"
        >
          <MoreVertical size={16} />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={4}
          className="z-50 min-w-[160px] rounded-xl border border-slate-100 bg-white p-1.5 shadow-xl"
        >
          {items.map((item, i) => (
            <DropdownMenu.Item
              key={i}
              onSelect={(e) => {
                e.preventDefault();
                item.onClick();
              }}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium cursor-pointer outline-none transition-colors",
                item.danger
                  ? "text-red-600 hover:bg-red-50"
                  : "text-slate-700 hover:bg-slate-100"
              )}
            >
              {item.icon && <item.icon size={15} />}
              {item.label}
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

// ─── Confirm Dialog ──────────────────────────────────────────
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  onConfirm,
  danger,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  onConfirm: () => void;
  danger?: boolean;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[92vw] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-2xl">
          <div className="flex items-start gap-3">
            {danger && (
              <div className="p-2 rounded-xl bg-red-100 text-red-600">
                <AlertTriangle size={20} />
              </div>
            )}
            <div className="flex-1">
              <Dialog.Title className="text-lg font-bold text-slate-900">
                {title}
              </Dialog.Title>
              {description && (
                <Dialog.Description className="text-sm text-slate-500 mt-1">
                  {description}
                </Dialog.Description>
              )}
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="secondary" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              variant={danger ? "danger" : "primary"}
              onClick={() => {
                onConfirm();
                onOpenChange(false);
              }}
            >
              {confirmLabel}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

// ─── Generic Modal ───────────────────────────────────────────
export function Modal({
  open,
  onOpenChange,
  title,
  children,
  wide,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  title: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm" />
        <Dialog.Content
          className={cn(
            "fixed left-1/2 top-1/2 z-50 w-[94vw] -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white shadow-2xl max-h-[90vh] overflow-y-auto",
            wide ? "max-w-3xl" : "max-w-lg"
          )}
        >
          <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 rounded-t-2xl">
            <Dialog.Title className="text-lg font-bold text-slate-900">
              {title}
            </Dialog.Title>
          </div>
          <div className="p-6">{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

// ─── Tabs (pill style) ───────────────────────────────────────
export function Tabs<T extends string>({
  tabs,
  value,
  onChange,
}: {
  tabs: { value: T; label: string; icon?: React.ElementType }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1 bg-slate-100 p-1 rounded-xl w-fit mb-6">
      {tabs.map((t) => (
        <button
          key={t.value}
          onClick={() => onChange(t.value)}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all",
            value === t.value
              ? "bg-white text-indigo-700 shadow-sm"
              : "text-slate-500 hover:text-slate-800"
          )}
        >
          {t.icon && <t.icon size={15} />}
          {t.label}
        </button>
      ))}
    </div>
  );
}

// ─── Search Input ────────────────────────────────────────────
export function SearchInput({
  value,
  onChange,
  placeholder = "Search...",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="relative">
      <Search
        size={16}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
      />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-900 bg-white"
      />
    </div>
  );
}

// ─── Question Type Badge ─────────────────────────────────────
// Maps a container test.type to the admin-facing content type.
const TYPE_META: Record<string, { label: string; className: string }> = {
  pyp: { label: "Previous Year", className: "bg-amber-100 text-amber-700" },
  practice: { label: "Practice", className: "bg-blue-100 text-blue-700" },
  mock: { label: "Test Series", className: "bg-indigo-100 text-indigo-700" },
  live: { label: "Test Series", className: "bg-indigo-100 text-indigo-700" },
  chapter: { label: "Practice", className: "bg-blue-100 text-blue-700" },
  subject: { label: "Practice", className: "bg-blue-100 text-blue-700" },
  daily: { label: "Daily Quiz", className: "bg-violet-100 text-violet-700" },
};

export function contentTypeLabel(testType: string): string {
  return TYPE_META[testType]?.label ?? testType;
}

export function QuestionTypeBadge({ type }: { type: string }) {
  const meta = TYPE_META[type] ?? {
    label: type,
    className: "bg-slate-100 text-slate-600",
  };
  return (
    <span
      className={cn(
        "px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap",
        meta.className
      )}
    >
      {meta.label}
    </span>
  );
}

// ─── Client-side pagination (for small admin lists) ─────────────
// These tables are small, so we slice locally rather than adding a
// server round-trip. Returns the current page's slice + controls.
export function usePagination<T>(items: T[], pageSize = 20) {
  const [page, setPage] = useState(1);
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  // Clamp when the list shrinks (e.g. after a delete) so we never strand
  // the user on an empty page.
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);
  const current = Math.min(page, totalPages);
  const start = (current - 1) * pageSize;
  return {
    page: current,
    setPage,
    totalPages,
    total,
    pageItems: items.slice(start, start + pageSize),
    from: total === 0 ? 0 : start + 1,
    to: Math.min(start + pageSize, total),
  };
}

export function Pagination({
  page,
  totalPages,
  onChange,
  from,
  to,
  total,
  label = "items",
}: {
  page: number;
  totalPages: number;
  onChange: (p: number) => void;
  from: number;
  to: number;
  total: number;
  label?: string;
}) {
  if (total === 0) return null;
  // Compact window of page numbers around the current page.
  const span = 2;
  const startP = Math.max(1, page - span);
  const endP = Math.min(totalPages, page + span);
  const nums: number[] = [];
  for (let i = startP; i <= endP; i++) nums.push(i);

  const PageBtn = ({ p, active }: { p: number; active?: boolean }) => (
    <button
      onClick={() => onChange(p)}
      className={cn(
        "min-w-[32px] h-8 px-2 rounded-lg text-sm font-medium transition-colors",
        active
          ? "bg-indigo-600 text-white"
          : "text-slate-600 hover:bg-slate-100"
      )}
    >
      {p}
    </button>
  );

  return (
    <div className="flex items-center justify-between gap-3 mt-4 flex-wrap">
      <span className="text-xs text-slate-400">
        Showing {from}–{to} of {total} {label}
      </span>
      {totalPages > 1 && (
        <div className="flex items-center gap-1">
          <button
            onClick={() => onChange(page - 1)}
            disabled={page <= 1}
            className="h-8 px-2 rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-transparent flex items-center"
            aria-label="Previous page"
          >
            <ChevronLeft size={16} />
          </button>
          {startP > 1 && (
            <>
              <PageBtn p={1} />
              {startP > 2 && <span className="px-1 text-slate-400">…</span>}
            </>
          )}
          {nums.map((n) => (
            <PageBtn key={n} p={n} active={n === page} />
          ))}
          {endP < totalPages && (
            <>
              {endP < totalPages - 1 && <span className="px-1 text-slate-400">…</span>}
              <PageBtn p={totalPages} />
            </>
          )}
          <button
            onClick={() => onChange(page + 1)}
            disabled={page >= totalPages}
            className="h-8 px-2 rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-transparent flex items-center"
            aria-label="Next page"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Status Badge ────────────────────────────────────────────
export function StatusBadge({ status }: { status?: string }) {
  const published = status !== "draft";
  return (
    <span
      className={cn(
        "px-2.5 py-0.5 rounded-full text-xs font-semibold",
        published ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"
      )}
    >
      {published ? "Published" : "Draft"}
    </span>
  );
}
