import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, HardDrive, ShieldCheck, Sparkles } from "lucide-react";
import { UploadFlow } from "@/components/files/UploadFlow";
import { Card } from "@/components/ui/Card";
import { getProfile } from "@/lib/auth";
import { getStorageSummary } from "@/lib/files-server";
import { formatBytes, percent } from "@/lib/format";
import type { FolderRecord } from "@/types";

export const metadata: Metadata = { title: "Upload" };
export const dynamic = "force-dynamic";

export default async function UploadPage() {
  const { user, supabase } = await getProfile();

  const [{ data: folderData }, storage] = await Promise.all([
    supabase
      .from("folders")
      .select("*")
      .eq("user_id", user.id)
      .order("name", { ascending: true }),
    getStorageSummary(supabase, user.id),
  ]);

  const folders = (folderData as FolderRecord[] | null) ?? [];
  const freeBytes = Math.max(0, storage.quotaBytes - storage.usedBytes);

  return (
    <div className="space-y-4">
      <Link
        href="/files"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted transition hover:text-ink"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to my files
      </Link>

      <UploadFlow folders={folders} />

      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="flex items-start gap-3 p-4">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl bg-primary/15 text-primary-deep dark:text-primary-soft">
            <HardDrive className="h-4 w-4" />
          </span>
          <div>
            <p className="text-sm font-bold text-ink">Space left</p>
            <p className="mt-0.5 text-xs text-muted">
              {formatBytes(freeBytes)} free of {formatBytes(storage.quotaBytes)} ·{" "}
              {Math.round(percent(storage.usedBytes, storage.quotaBytes))}% used
            </p>
          </div>
        </Card>
        <Card className="flex items-start gap-3 p-4">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl bg-softBlue text-[#356b96]">
            <ShieldCheck className="h-4 w-4" />
          </span>
          <div>
            <p className="text-sm font-bold text-ink">Private by default</p>
            <p className="mt-0.5 text-xs text-muted">
              Files land in a private bucket. Only signed links can open them.
            </p>
          </div>
        </Card>
        <Card className="flex items-start gap-3 p-4">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl bg-cream text-[#8a6414]">
            <Sparkles className="h-4 w-4" />
          </span>
          <div>
            <p className="text-sm font-bold text-ink">Lumi helps out</p>
            <p className="mt-0.5 text-xs text-muted">
              Previews are made right in your browser. Summaries need an AI
              provider key on the server.
            </p>
          </div>
        </Card>
      </div>

      <p className="text-center text-[11px] leading-relaxed text-muted">
        Up to 50 MB per file. PDF, DOC, DOCX, TXT, PPT, PPTX, PNG, JPG, WEBP and
        GIF are supported. Phone photo formats such as HEIC can be converted to
        JPG before uploading.
      </p>
    </div>
  );
}
