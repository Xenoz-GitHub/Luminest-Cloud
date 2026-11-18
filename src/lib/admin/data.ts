import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Server-only analytics. Every query uses the service-role client and is only
 * reachable from an authenticated admin session, so no aggregation happens in
 * the browser and no RLS bypass reaches the client bundle.
 */

export interface AdminOverview {
  users: {
    total: number;
    newLast7: number;
    newLast30: number;
    onboarded: number;
  };
  files: {
    total: number;
    bytes: number;
    byExtension: { extension: string; count: number }[];
    previewReady: number;
    previewFailed: number;
    previewQueued: number;
    inTrash: number;
  };
  ai: {
    summariesReady: number;
    summariesFailed: number;
  };
  sharing: {
    active: number;
    revoked: number;
    expired: number;
  };
  reviews: { total: number; average: number };
  bugs: { open: number; total: number };
  storageTopUsers: {
    userId: string;
    username: string;
    bytes: number;
    files: number;
  }[];
  recentUsers: {
    id: string;
    username: string;
    createdAt: string;
    plan: string;
  }[];
  auditLog: {
    id: number;
    action: string;
    ip: string | null;
    success: boolean;
    createdAt: string;
  }[];
}

export interface AdminBugReport {
  id: string;
  email: string | null;
  category: string;
  title: string;
  details: string;
  steps: string | null;
  pageUrl: string | null;
  status: string;
  adminNote: string | null;
  createdAt: string;
}

function isoDaysAgo(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

export async function getAdminOverview(): Promise<AdminOverview> {
  const admin = createAdminClient();

  const [
    usersTotal,
    usersNew7,
    usersNew30,
    onboarded,
    filesAll,
    previewReady,
    previewFailed,
    previewQueued,
    inTrash,
    summariesReady,
    summariesFailed,
    sharesActive,
    sharesRevoked,
    sharesExpired,
    reviewsAll,
    bugsOpen,
    bugsTotal,
    recentProfiles,
    auditRows,
  ] = await Promise.all([
    admin.from("profiles").select("id", { count: "exact", head: true }),
    admin
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .gte("created_at", isoDaysAgo(7)),
    admin
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .gte("created_at", isoDaysAgo(30)),
    admin
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("preferences->>onboarded", "true"),
    admin.from("files").select("extension, size_bytes, user_id, deleted_at"),
    admin
      .from("files")
      .select("id", { count: "exact", head: true })
      .eq("preview_status", "ready"),
    admin
      .from("files")
      .select("id", { count: "exact", head: true })
      .eq("preview_status", "failed"),
    admin
      .from("files")
      .select("id", { count: "exact", head: true })
      .in("preview_status", ["queued", "processing"]),
    admin
      .from("files")
      .select("id", { count: "exact", head: true })
      .not("deleted_at", "is", null),
    admin
      .from("file_summaries")
      .select("id", { count: "exact", head: true })
      .eq("status", "ready"),
    admin
      .from("file_summaries")
      .select("id", { count: "exact", head: true })
      .eq("status", "failed"),
    admin
      .from("share_links")
      .select("id", { count: "exact", head: true })
      .is("revoked_at", null)
      .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`),
    admin
      .from("share_links")
      .select("id", { count: "exact", head: true })
      .not("revoked_at", "is", null),
    admin
      .from("share_links")
      .select("id", { count: "exact", head: true })
      .is("revoked_at", null)
      .not("expires_at", "is", null)
      .lte("expires_at", new Date().toISOString()),
    admin.from("reviews").select("rating"),
    admin
      .from("bug_reports")
      .select("id", { count: "exact", head: true })
      .eq("status", "open"),
    admin.from("bug_reports").select("id", { count: "exact", head: true }),
    admin
      .from("profiles")
      .select("id, username, created_at, plan")
      .order("created_at", { ascending: false })
      .limit(8),
    admin
      .from("admin_audit_log")
      .select("id, action, ip, success, created_at")
      .order("created_at", { ascending: false })
      .limit(12),
  ]);

  const files = (filesAll.data ?? []) as {
    extension: string | null;
    size_bytes: number | null;
    user_id: string;
    deleted_at: string | null;
  }[];

  const byExtensionMap = new Map<string, number>();
  const perUserMap = new Map<string, { bytes: number; files: number }>();
  let totalBytes = 0;

  for (const file of files) {
    const ext = (file.extension ?? "other").toLowerCase();
    byExtensionMap.set(ext, (byExtensionMap.get(ext) ?? 0) + 1);
    const bytes = Number(file.size_bytes) || 0;
    totalBytes += bytes;
    const entry = perUserMap.get(file.user_id) ?? { bytes: 0, files: 0 };
    entry.bytes += bytes;
    entry.files += 1;
    perUserMap.set(file.user_id, entry);
  }

  const ratings = (reviewsAll.data ?? []) as { rating: number }[];
  const average = ratings.length
    ? ratings.reduce((sum, row) => sum + Number(row.rating || 0), 0) /
      ratings.length
    : 0;

  // Resolve usernames for the heaviest storage users.
  const topIds = [...perUserMap.entries()]
    .sort((a, b) => b[1].bytes - a[1].bytes)
    .slice(0, 6)
    .map(([id]) => id);

  let nameById = new Map<string, string>();
  if (topIds.length) {
    const { data: nameRows } = await admin
      .from("profiles")
      .select("id, username")
      .in("id", topIds);
    nameById = new Map(
      ((nameRows ?? []) as { id: string; username: string }[]).map((row) => [
        row.id,
        row.username,
      ])
    );
  }

  const storageTopUsers = topIds.map((id) => ({
    userId: id,
    username: nameById.get(id) ?? "unknown",
    bytes: perUserMap.get(id)?.bytes ?? 0,
    files: perUserMap.get(id)?.files ?? 0,
  }));

  return {
    users: {
      total: usersTotal.count ?? 0,
      newLast7: usersNew7.count ?? 0,
      newLast30: usersNew30.count ?? 0,
      onboarded: onboarded.count ?? 0,
    },
    files: {
      total: files.length,
      bytes: totalBytes,
      byExtension: [...byExtensionMap.entries()]
        .map(([extension, count]) => ({ extension, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 8),
      previewReady: previewReady.count ?? 0,
      previewFailed: previewFailed.count ?? 0,
      previewQueued: previewQueued.count ?? 0,
      inTrash: inTrash.count ?? 0,
    },
    ai: {
      summariesReady: summariesReady.count ?? 0,
      summariesFailed: summariesFailed.count ?? 0,
    },
    sharing: {
      active: sharesActive.count ?? 0,
      revoked: sharesRevoked.count ?? 0,
      expired: sharesExpired.count ?? 0,
    },
    reviews: { total: ratings.length, average },
    bugs: { open: bugsOpen.count ?? 0, total: bugsTotal.count ?? 0 },
    storageTopUsers,
    recentUsers: ((recentProfiles.data ?? []) as {
      id: string;
      username: string;
      created_at: string;
      plan: string | null;
    }[]).map((row) => ({
      id: row.id,
      username: row.username,
      createdAt: row.created_at,
      plan: row.plan ?? "free",
    })),
    auditLog: ((auditRows.data ?? []) as {
      id: number;
      action: string;
      ip: string | null;
      success: boolean;
      created_at: string;
    }[]).map((row) => ({
      id: row.id,
      action: row.action,
      ip: row.ip,
      success: row.success,
      createdAt: row.created_at,
    })),
  };
}

export async function getBugReports(limit = 50): Promise<AdminBugReport[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("bug_reports")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  return ((data ?? []) as Record<string, unknown>[]).map((row) => ({
    id: String(row.id),
    email: (row.email as string | null) ?? null,
    category: String(row.category ?? "other"),
    title: String(row.title ?? ""),
    details: String(row.details ?? ""),
    steps: (row.steps as string | null) ?? null,
    pageUrl: (row.page_url as string | null) ?? null,
    status: String(row.status ?? "open"),
    adminNote: (row.admin_note as string | null) ?? null,
    createdAt: String(row.created_at ?? ""),
  }));
}
