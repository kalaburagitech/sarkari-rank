"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Toaster } from "sonner";
import { AdminAuthProvider, useAdminAuth } from "@/lib/admin-auth";
import { AdminShell } from "@/components/admin/shell";
import { LoadingState } from "@/components/admin/ui";

function AdminGuard({ children }: { children: React.ReactNode }) {
  const { admin, isLoading } = useAdminAuth();
  const router = useRouter();
  const pathname = usePathname();
  const isLoginPage = pathname === "/admin/login";

  useEffect(() => {
    if (!isLoading && !admin && !isLoginPage) {
      router.replace("/admin/login");
    }
    if (!isLoading && admin && isLoginPage) {
      router.replace("/admin");
    }
  }, [admin, isLoading, isLoginPage, router]);

  if (isLoading) return <LoadingState message="Checking session..." />;
  if (!admin && !isLoginPage) return <LoadingState message="Redirecting to login..." />;
  if (isLoginPage) return <>{children}</>;
  if (!admin) return null;

  return <AdminShell>{children}</AdminShell>;
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminAuthProvider>
      <Toaster position="top-right" richColors closeButton />
      <AdminGuard>{children}</AdminGuard>
    </AdminAuthProvider>
  );
}
