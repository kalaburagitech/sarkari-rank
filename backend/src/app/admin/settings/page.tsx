"use client";

import { Card } from "@/components/admin/ui";
import { PageHeader } from "@/components/admin/ui";

export default function SettingsPage() {
  return (
    <div>
      <PageHeader title="Settings" description="Platform configuration" />
      <div className="grid gap-4 max-w-2xl">
        {[
          { label: "App Name", value: "SarkariRank - Govt Exam Prep" },
          { label: "Convex URL", value: "silent-jackal-490.convex.cloud" },
          { label: "Premium Pass Price", value: "₹499/year" },
          { label: "Supported Languages", value: "English, Hindi, Bengali, Tamil, Telugu, Marathi, Gujarati, Kannada" },
          { label: "Admin Email", value: "admin@sarkarirank.com" },
        ].map((item) => (
          <Card key={item.label} className="p-4 flex justify-between items-center">
            <span className="text-sm text-slate-500">{item.label}</span>
            <span className="text-sm font-medium text-slate-900">{item.value}</span>
          </Card>
        ))}
      </div>
    </div>
  );
}
