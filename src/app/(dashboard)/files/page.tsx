import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ChevronRight,
  FolderOpen,
  SearchX,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";
import { FileGrid } from "@/components/files/FileGrid";
import { FilesToolbar } from "@/components/files/FilesToolbar";
import { TrashList } from "@/components/files/TrashList";
import { FolderManager } from "@/components/folders/FolderManager";
import { EmptyState } from "@/components/ui/EmptyState";
import { getProfile } from "@/lib/auth";
import { buildBreadcrumbs } from "@/lib/data";
import {
  attachFileListItems,
  getFolderFileCounts,
} from "@/lib/files-server";
import { cn } from "@/lib/utils";
import type { FileRecord, FolderRecord, TagRecord } from "@/types";

export const metadata: Metadata = { title: "My Files" };
export const dynamic = "force-dynamic";

const TYPE_EXTENSIONS: Record<string, string[]> = {
  pdf: ["pdf"],
  document: ["doc", "docx"],
  presentation: ["ppt", "pptx"],
  image: ["png", "jpg", "jpeg", "webp", "gif"],
  text: ["txt"],
};

const SORTS = ["recent", "name", "largest", "smallest", "type"];

function first(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

export default async function FilesPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const { user, supabase } = await getProfile();

  const q = first(searchParams.q).trim().slice(0, 120);
  const typeParam = first(searchParams.type);
  const type = TYPE_EXTENSIONS[typeParam] ? typeParam : "";
  const sortParam = first(searchParams.sort);
  const sort = SORTS.includes(sortParam) ? sortParam : "recent";
  const view = first(searchParams.view) === "list" ? "list" : "grid";
  const favorite = first(searchParams.favorite) === "1";
  const trash = first(searchParams.trash) === "1";
  const tagParam = first(searchParams.tag);
  const folderParam = first(searchParams.folder);

  const [
    { data: folderData },
    { data: tagData },
    folderCounts,
    { count: trashCount },
  ] = await Promise.all([
    supabase
      .from("folders")
      .select("*")
      .eq("user_id", user.id)
      .order("name", { ascending: true }),
    supabase
      .from("tags")
      .select("*")
      .eq("user_id", user.id)
      .order("name", { ascending: true }),
    getFolderFileCounts(supabase, user.id),
    supabase
      .from("files")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .not("deleted_at", "is", null),
  ]);

  const folders = (folderData as FolderRecord[] | null) ?? [];
  const tags = (tagData as TagRecord[] | null) ?? [];
  const tag = tags.some((item) => item.id === tagParam) ? tagParam : "";

  const currentFolder = folderParam
    ? folders.find((folder) => folder.id === folderParam) ?? null
    : null;
  if (folderParam && !currentFolder) notFound();

  const breadcrumbs = currentFolder
    ? buildBreadcrumbs(folders, currentFolder.id)
    : [];

  const childFolders = trash
    ? []
    : folders.filter((folder) =>
        currentFolder
          ? folder.parent_id === currentFolder.id
          : folder.parent_id === null
      );

  let tagFileIds: string[] | null = null;
  if (tag && !trash) {
    const { data } = await supabase
      .from("file_tags")
      .select("file_id")
      .eq("tag_id", tag);
    tagFileIds = (data ?? []).map((row) => row.file_id as string);
  }

  let query = supabase
    .from("files")
    .select("*")
    .eq("user_id", user.id);

  if (trash) {
    query = query.not("deleted_at", "is", null);
  } else {
    query = query.is("deleted_at", null);
  }

  if (currentFolder && !trash) {
    query = query.eq("folder_id", currentFolder.id);
  }
  if (favorite && !trash) query = query.eq("is_favorite", true);
  if (type && !trash) query = query.in("extension", TYPE_EXTENSIONS[type]);
  if (tagFileIds && !trash) {
    if (!tagFileIds.length) {
      query = query.eq("id", "00000000-0000-0000-0000-000000000000");
    } else {
      query = query.in("id", tagFileIds);
    }
  }
  if (q) {
    const safe = q.replace(/[(),*%]/g, " ").trim();
    if (safe) {
      query = query.or(
        `name.ilike.%${safe}%,extracted_text.ilike.%${safe}%`
      );
    }
  }

  switch (sort) {
    case "name":
      query = query.order("name", { ascending: true });
      break;
    case "largest":
      query = query.order("size_bytes", { ascending: false });
      break;
    case "smallest":
      query = query.order("size_bytes", { ascending: true });
      break;
    case "type":
      query = query
        .order("extension", { ascending: true })
        .order("name", { ascending: true });
      break;
    default:
      query = query.order(trash ? "deleted_at" : "created_at", {
        ascending: false,
      });
  }

  const { data: fileData } = await query.limit(200);
  const files = await attachFileListItems(
    supabase,
    user.id,
    (fileData as FileRecord[] | null) ?? []
  );

  const hasFilters = Boolean(q || type || favorite || tag || trash);
  const title = trash
    ? "The bin"
    : currentFolder
      ? currentFolder.name
      : "My library";
  const description = trash
    ? "Files here are still recoverable until you delete them forever."
    : currentFolder
      ? "Everything tucked into this folder."
      : "Every little thing you have brought to Lumi.";

  const emptyState = trash ? (
    <EmptyState
      state="empty-folder"
      title="The bin is empty"
      description="Nothing has been thrown away. That is a very tidy nest."
      action={
        <Link
          href="/files"
          className="inline-flex h-11 items-center gap-2 rounded-full bg-primary px-5 text-sm font-bold text-[#3d3153] shadow-soft transition hover:bg-primary-deep hover:text-white"
        >
          Back to my files
        </Link>
      }
    />
  ) : q || type || favorite || tag ? (
    <EmptyState
      state="no-results"
      title="No files match that"
      description="Try a shorter search, or clear a filter or two. Lumi will keep looking if you want."
      action={
        <Link
          href={currentFolder ? `/files?folder=${currentFolder.id}` : "/files"}
          className="inline-flex h-11 items-center gap-2 rounded-full bg-primary px-5 text-sm font-bold text-[#3d3153] shadow-soft transition hover:bg-primary-deep hover:text-white"
        >
          <X className="h-4 w-4" /> Clear filters
        </Link>
      }
    />
  ) : currentFolder ? (
    <EmptyState
      state="empty-folder"
      title="This folder is cozy and empty"
      description="Upload a file here, or move something in from another folder."
      action={
        <Link
          href="/upload"
          className="inline-flex h-11 items-center gap-2 rounded-full bg-primary px-5 text-sm font-bold text-[#3d3153] shadow-soft transition hover:bg-primary-deep hover:text-white"
        >
          <UploadCloud className="h-4 w-4" /> Upload a file
        </Link>
      }
    />
  ) : (
    <EmptyState
      state="empty-library"
      title="Your library is waiting"
      description="Bring your first PDF, deck, image or note. Lumi will make it previewable and easy to find."
      action={
        <Link
          href="/upload"
          className="inline-flex h-11 items-center gap-2 rounded-full bg-primary px-5 text-sm font-bold text-[#3d3153] shadow-soft transition hover:bg-primary-deep hover:text-white"
        >
          <UploadCloud className="h-4 w-4" /> Upload your first file
        </Link>
      }
    />
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary-deep dark:text-primary-soft">
            {trash ? "Gone but not forgotten" : "Your collection"}
          </p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
            {title}
          </h1>
          <p className="mt-1 text-sm text-muted">{description}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={trash ? "/files" : "/files?trash=1"}
            className={cn(
              "inline-flex h-10 items-center gap-1.5 rounded-full border px-3.5 text-xs font-semibold transition",
              trash
                ? "border-primary bg-primary text-[#3d3153]"
                : "border-line bg-surface text-muted hover:border-primary/40 hover:text-ink"
            )}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Bin{trashCount ? ` · ${trashCount}` : ""}
          </Link>
          {!trash && (
            <Link
              href="/upload"
              className="inline-flex h-10 items-center gap-1.5 rounded-full bg-primary px-4 text-xs font-bold text-[#3d3153] shadow-soft transition hover:bg-primary-deep hover:text-white"
            >
              <UploadCloud className="h-3.5 w-3.5" /> Upload
            </Link>
          )}
        </div>
      </div>

      {!trash && (
        <nav
          aria-label="Folder breadcrumb"
          className="flex flex-wrap items-center gap-1 text-xs text-muted"
        >
          <Link
            href="/files"
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-1 font-semibold transition hover:bg-surface2 hover:text-ink",
              !currentFolder && "bg-surface2 text-ink"
            )}
          >
            <FolderOpen className="h-3.5 w-3.5" /> All files
          </Link>
          {breadcrumbs.map((folder, index) => (
            <span key={folder.id} className="inline-flex items-center gap-1">
              <ChevronRight className="h-3.5 w-3.5 text-muted/60" />
              <Link
                href={`/files?folder=${folder.id}`}
                className={cn(
                  "rounded-full px-2 py-1 font-semibold transition hover:bg-surface2 hover:text-ink",
                  index === breadcrumbs.length - 1 &&
                    "bg-surface2 text-ink"
                )}
              >
                {folder.name}
              </Link>
            </span>
          ))}
        </nav>
      )}

      <FilesToolbar
        query={q}
        type={type}
        sort={sort}
        view={view}
        favorite={favorite}
        tag={tag}
        folder={currentFolder?.id ?? null}
        tags={tags}
        trash={trash}
      />

      {childFolders.length > 0 && !hasFilters && (
        <FolderManager
          folders={childFolders}
          counts={folderCounts}
          parentId={currentFolder?.id ?? null}
          title={currentFolder ? "Folders inside" : "Your folders"}
          description="Open one, rename it, or make a new one."
        />
      )}

      {!hasFilters && childFolders.length === 0 && !trash && (
        <FolderManager
          folders={[]}
          counts={folderCounts}
          parentId={currentFolder?.id ?? null}
          title="Folders"
          showCreate
        />
      )}

      <div>
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="text-xs font-semibold text-muted">
            {files.length} {files.length === 1 ? "file" : "files"}
            {q ? ` matching “${q}”` : ""}
          </p>
          {hasFilters && !trash && (
            <Link
              href={currentFolder ? `/files?folder=${currentFolder.id}` : "/files"}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary-deep hover:underline dark:text-primary-soft"
            >
              <X className="h-3 w-3" /> Clear filters
            </Link>
          )}
        </div>

        {!files.length ? (
          emptyState
        ) : trash ? (
          <TrashList files={files} />
        ) : (
          <FileGrid files={files} view={view} />
        )}
      </div>

      {hasFilters && !files.length && (
        <p className="text-center text-xs leading-relaxed text-muted">
          <SearchX className="mr-1 inline-block h-3.5 w-3.5 -translate-y-px align-middle" />
          Previews and summaries are still searchable after they finish
          processing.
        </p>
      )}
    </div>
  );
}
