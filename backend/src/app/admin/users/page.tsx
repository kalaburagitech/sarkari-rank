"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { toast } from "sonner";
import { PageHeader, LoadingState, EmptyState, TableWrap, Badge, Button } from "@/components/admin/ui";

export default function UsersPage() {
  const users = useQuery(api.content.listAllUsers);
  const createSubscription = useMutation(api.content.createSubscription);

  const grantPremium = async (userId: string) => {
    try {
      await createSubscription({ userId: userId as any, plan: "yearly", amount: 0 });
      toast.success("Premium granted!");
    } catch (err) { toast.error((err as Error).message); }
  };

  if (users === undefined) return <LoadingState />;

  return (
    <div>
      <PageHeader title="Users" description={`${users.length} registered students`} />
      {users.length === 0 ? <EmptyState message="No users yet. They'll appear when students register on the mobile app." /> : (
        <TableWrap>
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b">
              <tr>{["Name", "Email", "Premium", "Tests", "Streak", "Actions"].map((h) => <th key={h} className="text-left p-4 font-semibold text-slate-600">{h}</th>)}</tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user._id} className="border-b border-slate-50 hover:bg-indigo-50/30">
                  <td className="p-4 font-medium">{user.name}</td>
                  <td className="p-4 text-slate-500">{user.email}</td>
                  <td className="p-4">{user.isPremium ? <Badge color="amber">Premium</Badge> : <Badge color="green">Free</Badge>}</td>
                  <td className="p-4">{user.totalTestsTaken}</td>
                  <td className="p-4">{user.streak}d</td>
                  <td className="p-4">
                    {!user.isPremium && <Button size="sm" variant="secondary" onClick={() => grantPremium(user._id)}>Grant Premium</Button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrap>
      )}
    </div>
  );
}
