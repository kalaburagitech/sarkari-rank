"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { Users, FileQuestion, ClipboardList, TrendingUp, Crown, Activity, Database, Rocket } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, StatCard, Card, Button, LoadingState } from "@/components/admin/ui";

export default function AdminDashboard() {
  const stats = useQuery(api.content.getDashboardStats);
  const seedDatabase = useMutation(api.seed.seedDatabase);
  const seedProduction = useMutation(api.seedProduction.seedProductionData);

  const handleBasicSeed = async () => {
    try {
      const r = await seedDatabase();
      toast.success(r.message ?? "Basic seed done!");
    } catch (e) { toast.error(String(e)); }
  };

  const handleProductionSeed = async () => {
    try {
      toast.info("Loading 55+ tests with real questions... please wait");
      const r = await seedProduction({ force: true });
      toast.success(r.message ?? "Production data loaded!");
    } catch (e) { toast.error(String(e)); }
  };

  if (stats === undefined) return <LoadingState message="Connecting to Convex live database..." />;

  return (
    <div>
      <PageHeader title="Dashboard" description="Real-time SarkariRank platform overview"
        action={
          <div className="flex gap-2">
            <Button onClick={handleBasicSeed} variant="secondary"><Database size={16} /> Basic Seed</Button>
            <Button onClick={handleProductionSeed}><Rocket size={16} /> Load 55+ Tests</Button>
          </div>
        } />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
        <StatCard title="Total Students" value={stats.totalUsers} icon={Users} gradient="from-blue-500 to-blue-600" />
        <StatCard title="Premium Users" value={stats.premiumUsers} icon={Crown} gradient="from-amber-500 to-orange-500" />
        <StatCard title="Active Tests" value={stats.totalTests} icon={ClipboardList} gradient="from-emerald-500 to-green-600" />
        <StatCard title="Total Questions" value={stats.totalQuestions} icon={FileQuestion} gradient="from-violet-500 to-purple-600" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        <StatCard title="Total Attempts" value={stats.totalAttempts} icon={Activity} gradient="from-indigo-500 to-indigo-600" />
        <StatCard title="Attempts (7 days)" value={stats.recentAttempts} icon={TrendingUp} gradient="from-teal-500 to-cyan-600" />
        <StatCard title="Revenue (₹)" value={stats.revenue.toLocaleString("en-IN")} icon={Crown} gradient="from-rose-500 to-pink-600" />
      </div>

      {stats.totalTests < 10 && (
        <Card className="p-6 mb-6 bg-gradient-to-r from-indigo-50 to-violet-50 border-indigo-200">
          <h3 className="font-bold text-indigo-900 text-lg mb-2">⚡ Quick Setup for Demo</h3>
          <p className="text-indigo-700 text-sm mb-4">Click &quot;Load 55+ Tests&quot; to populate the app with 55+ real tests, 500+ questions, study notes & current affairs for your client demo tomorrow.</p>
          <Button onClick={handleProductionSeed}><Rocket size={16} /> Load Production Data Now</Button>
        </Card>
      )}
    </div>
  );
}
