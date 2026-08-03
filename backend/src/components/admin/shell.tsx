"use client";

import { Suspense } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutDashboard, BookOpen, FileQuestion, ClipboardList, Users,
  Newspaper, StickyNote, HelpCircle, Settings, GraduationCap, LogOut, Zap,
  ListChecks, CalendarClock, Layers,
} from "lucide-react";
import { useAdminAuth } from "@/lib/admin-auth";
import { BrandLogo } from "@/components/BrandLogo";
import { cn } from "@/lib/utils";

type NavItem = { href: string; label: string; icon: React.ElementType; tab?: string };
type NavGroup = { section: string | null; items: NavItem[] };

const navGroups: NavGroup[] = [
  { section: null, items: [{ href: "/admin", label: "Dashboard", icon: LayoutDashboard }] },
  {
    section: "Catalog",
    items: [
      { href: "/admin/categories", label: "Categories", icon: BookOpen },
      { href: "/admin/exams", label: "Exams", icon: GraduationCap },
    ],
  },
  {
    section: "Questions",
    items: [
      { href: "/admin/questions?tab=all", label: "All Questions", icon: ListChecks, tab: "all" },
      { href: "/admin/questions?tab=practice", label: "Practice", icon: BookOpen, tab: "practice" },
      { href: "/admin/questions?tab=pyp", label: "Previous Year", icon: CalendarClock, tab: "pyp" },
      { href: "/admin/questions?tab=series", label: "Test Series", icon: Layers, tab: "series" },
    ],
  },
  {
    section: "Tests",
    items: [
      { href: "/admin/test-series", label: "Test Series", icon: ClipboardList },
      { href: "/admin/tests", label: "Tests & Quizzes", icon: FileQuestion },
      { href: "/admin/daily-quiz", label: "Daily Quiz", icon: Zap },
    ],
  },
  {
    section: "Content",
    items: [
      { href: "/admin/study-notes", label: "Notes", icon: StickyNote },
      { href: "/admin/current-affairs", label: "Current Affairs", icon: Newspaper },
    ],
  },
  {
    section: "People",
    items: [
      { href: "/admin/users", label: "Users", icon: Users },
      { href: "/admin/doubts", label: "Doubts", icon: HelpCircle },
    ],
  },
  { section: null, items: [{ href: "/admin/settings", label: "Settings", icon: Settings }] },
];

function SidebarNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get("tab") ?? "all";

  const isActive = (item: NavItem) => {
    if (item.tab) {
      // Questions sub-links share one path; disambiguate by ?tab=
      return pathname === "/admin/questions" && currentTab === item.tab;
    }
    return pathname === item.href;
  };

  return (
    <nav className="flex-1 p-3 space-y-3 overflow-y-auto">
      {navGroups.map((group, gi) => (
        <div key={gi} className="space-y-0.5">
          {group.section && (
            <p className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-indigo-300/70">
              {group.section}
            </p>
          )}
          {group.items.map((item) => {
            const active = isActive(item);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                  active
                    ? "bg-white/20 text-white shadow-lg"
                    : "text-indigo-200 hover:bg-white/10 hover:text-white"
                )}
              >
                <item.icon size={17} />
                {item.label}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { admin, logout } = useAdminAuth();

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="sidebar-gradient w-64 text-white flex flex-col fixed h-full z-40 shadow-2xl">
        <div className="p-6 border-b border-white/10">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <BrandLogo size={36} showText subtitle="Admin Control Panel" />
          </motion.div>
        </div>
        <Suspense fallback={<div className="flex-1" />}>
          <SidebarNav />
        </Suspense>
        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-sm font-bold">
              {admin?.name?.charAt(0) ?? "A"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{admin?.name}</p>
              <p className="text-xs text-indigo-300 truncate">{admin?.email}</p>
            </div>
          </div>
          <button onClick={() => { logout(); router.push("/admin/login"); }}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-sm text-red-300 hover:bg-red-500/20 transition-colors">
            <LogOut size={15} /> Logout
          </button>
        </div>
      </aside>
      <main className="flex-1 ml-64 min-h-screen">
        <div className="p-8 max-w-7xl">{children}</div>
      </main>
    </div>
  );
}
