"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutDashboard, BookOpen, FileQuestion, ClipboardList, Users,
  Newspaper, StickyNote, HelpCircle, Settings, GraduationCap, LogOut, Zap,
} from "lucide-react";
import { useAdminAuth } from "@/lib/admin-auth";
import { BrandLogo } from "@/components/BrandLogo";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/categories", label: "Categories", icon: BookOpen },
  { href: "/admin/exams", label: "Exams", icon: GraduationCap },
  { href: "/admin/test-series", label: "Test Series", icon: ClipboardList },
  { href: "/admin/tests", label: "Tests & Quizzes", icon: FileQuestion },
  { href: "/admin/questions", label: "Questions", icon: HelpCircle },
  { href: "/admin/daily-quiz", label: "Daily Quiz", icon: Zap },
  { href: "/admin/study-notes", label: "Study Notes", icon: StickyNote },
  { href: "/admin/current-affairs", label: "Current Affairs", icon: Newspaper },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/doubts", label: "Doubts", icon: HelpCircle },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
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
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {navItems.map((item, i) => {
            const active = pathname === item.href;
            return (
              <motion.div key={item.href} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}>
                <Link href={item.href}
                  className={cn("flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                    active ? "bg-white/20 text-white shadow-lg" : "text-indigo-200 hover:bg-white/10 hover:text-white")}>
                  <item.icon size={17} />
                  {item.label}
                </Link>
              </motion.div>
            );
          })}
        </nav>
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
