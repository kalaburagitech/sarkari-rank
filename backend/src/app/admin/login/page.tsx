"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAdminAuth } from "@/lib/admin-auth";
import { Button, Input } from "@/components/admin/ui";
import { BrandLogo } from "@/components/BrandLogo";
import { Shield } from "lucide-react";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("admin@sarkarirank.com");
  const [password, setPassword] = useState("admin123");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { login } = useAdminAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const result = await login(email, password);
    setLoading(false);
    if (result.ok) {
      router.push("/admin");
    } else {
      setError(result.error ?? "Login failed");
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 sidebar-gradient items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          {[...Array(6)].map((_, i) => (
            <motion.div key={i} className="absolute rounded-full border border-white/30"
              style={{ width: 200 + i * 80, height: 200 + i * 80, top: `${10 + i * 12}%`, left: `${5 + i * 8}%` }}
              animate={{ rotate: 360 }} transition={{ duration: 20 + i * 5, repeat: Infinity, ease: "linear" }} />
          ))}
        </div>
        <div className="relative z-10 text-white max-w-md">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-3 mb-8">
              <BrandLogo size={52} showText subtitle="Govt Exam Prep Platform" />
            </div>
            <h2 className="text-4xl font-bold leading-tight mb-4">Admin Control Center</h2>
            <p className="text-indigo-200 text-lg leading-relaxed">
              Manage mock tests, question papers, quizzes, study notes, and 670+ govt exams from one powerful dashboard.
            </p>
            <div className="mt-8 grid grid-cols-2 gap-3">
              {["Mock Tests", "Live Tests", "PYP Papers", "Analytics"].map((f) => (
                <div key={f} className="bg-white/10 rounded-xl px-4 py-3 text-sm font-medium backdrop-blur-sm">{f}</div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right panel - login form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-slate-50">
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="w-full max-w-md">
          <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8">
            <div className="flex justify-center mb-6 lg:hidden">
              <BrandLogo size={48} showText subtitle="Admin Dashboard" variant="dark" />
            </div>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 bg-indigo-100 rounded-xl"><Shield className="text-indigo-600" size={22} /></div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Admin Login</h2>
                <p className="text-slate-500 text-sm">Secure access required</p>
              </div>
            </div>

            {error && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mb-4">
                {error}
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@sarkarirank.com" required />
              <Input label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter password" required />
              <Button type="submit" disabled={loading} className="w-full justify-center py-3">
                {loading ? "Signing in..." : "Sign In to Dashboard"}
              </Button>
            </form>

            <p className="text-center text-xs text-slate-400 mt-6">
              Default: admin@sarkarirank.com / admin123
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
