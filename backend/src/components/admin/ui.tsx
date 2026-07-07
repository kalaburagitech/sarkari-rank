"use client";

import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function PageHeader({ title, description, action }: { title: string; description?: string; action?: React.ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
        {description && <p className="text-slate-500 mt-1 text-sm">{description}</p>}
      </div>
      {action}
    </motion.div>
  );
}

export function Button({ children, onClick, type = "button", variant = "primary", disabled, className, size = "md" }: {
  children: React.ReactNode; onClick?: () => void; type?: "button" | "submit";
  variant?: "primary" | "secondary" | "danger" | "ghost"; disabled?: boolean; className?: string; size?: "sm" | "md";
}) {
  const variants = {
    primary: "bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white shadow-lg shadow-indigo-200",
    secondary: "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50",
    danger: "bg-red-500 hover:bg-red-600 text-white",
    ghost: "text-slate-600 hover:bg-slate-100",
  };
  const sizes = { sm: "px-3 py-1.5 text-xs", md: "px-5 py-2.5 text-sm" };
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      className={cn("inline-flex items-center gap-2 rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed", variants[variant], sizes[size], className)}>
      {children}
    </button>
  );
}

export function Input({ label, ...props }: { label?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      {label && <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>}
      <input {...props} className={cn("w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 bg-white transition-all", props.className)} />
    </div>
  );
}

export function Textarea({ label, ...props }: { label?: string } & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <div>
      {label && <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>}
      <textarea {...props} className={cn("w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 bg-white transition-all resize-none", props.className)} />
    </div>
  );
}

export function Select({ label, children, ...props }: { label?: string; children: React.ReactNode } & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div>
      {label && <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>}
      <select {...props} className={cn("w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 bg-white", props.className)}>
        {children}
      </select>
    </div>
  );
}

export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className={cn("bg-white rounded-2xl border border-slate-100 shadow-sm", className)}>
      {children}
    </motion.div>
  );
}

export function FormCard({ title, children, onSubmit }: { title: string; children: React.ReactNode; onSubmit: (e: React.FormEvent) => void }) {
  return (
    <motion.form initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} onSubmit={onSubmit}
      className="bg-gradient-to-br from-indigo-50 to-violet-50 rounded-2xl border border-indigo-100 p-6 mb-6 space-y-4">
      <h3 className="font-semibold text-indigo-900 text-lg">{title}</h3>
      {children}
    </motion.form>
  );
}

export function LoadingState({ message = "Loading data..." }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-slate-400">
      <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mb-3" />
      <p className="text-sm">{message}</p>
    </div>
  );
}

export function EmptyState({ message, action }: { message: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-slate-400">
      <p className="text-sm mb-4">{message}</p>
      {action}
    </div>
  );
}

export function Badge({ children, color = "indigo" }: { children: React.ReactNode; color?: string }) {
  const colors: Record<string, string> = {
    indigo: "bg-indigo-100 text-indigo-700",
    green: "bg-emerald-100 text-emerald-700",
    red: "bg-red-100 text-red-700",
    amber: "bg-amber-100 text-amber-700",
    blue: "bg-blue-100 text-blue-700",
  };
  return <span className={cn("px-2.5 py-0.5 rounded-full text-xs font-semibold", colors[color] ?? colors.indigo)}>{children}</span>;
}

export function StatCard({ title, value, icon: Icon, gradient }: { title: string; value: string | number; icon: React.ElementType; gradient: string }) {
  return (
    <motion.div whileHover={{ y: -4 }} className="stat-card-hover bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500 font-medium">{title}</p>
          <p className="text-3xl font-bold text-slate-900 mt-1">{value}</p>
        </div>
        <div className={cn("p-3 rounded-2xl bg-gradient-to-br shadow-lg", gradient)}>
          <Icon size={22} className="text-white" />
        </div>
      </div>
    </motion.div>
  );
}

export function TableWrap({ children }: { children: React.ReactNode }) {
  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">{children}</div>
    </Card>
  );
}
