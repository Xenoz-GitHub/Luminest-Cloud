import type { Metadata } from "next";
import { isAdminConfigured, requireAdminSession } from "@/lib/admin/auth";
import { getAdminOverview, getBugReports } from "@/lib/admin/data";
import { AdminLogin } from "./AdminLogin";
import { AdminDashboard } from "./AdminDashboard";

// Never index or cache the operator area.
export const metadata: Metadata = {
  title: "Operator",
  robots: { index: false, follow: false, nocache: true },
};
export const dynamic = "force-dynamic";

export default async function BlankPage() {
  if (!requireAdminSession()) {
    return <AdminLogin configured={isAdminConfigured()} />;
  }

  // Only reachable with a valid signed session; data is fetched server-side
  // with the service role and never shipped to an unauthenticated client.
  const [overview, bugs] = await Promise.all([getAdminOverview(), getBugReports()]);

  return <AdminDashboard overview={overview} bugs={bugs} />;
}
