import {
  File as FileIcon,
  FileImage,
  FileText,
  FileType2,
  Presentation,
} from "lucide-react";
import { getFileCategory } from "@/lib/format";
import { cn } from "@/lib/utils";

const STYLES: Record<
  string,
  { wrapper: string; icon: typeof FileIcon }
> = {
  pdf: { wrapper: "bg-[#F7DCE8] text-[#a34b60]", icon: FileText },
  document: { wrapper: "bg-softBlue text-[#356b96]", icon: FileText },
  presentation: { wrapper: "bg-cream text-[#8a6414]", icon: Presentation },
  image: { wrapper: "bg-[#DDF3E8] text-[#2f7a5c]", icon: FileImage },
  text: { wrapper: "bg-primary/15 text-primary-deep", icon: FileType2 },
  other: { wrapper: "bg-surface2 text-muted", icon: FileIcon },
};

export function FileTypeIcon({
  extension,
  size = "md",
  className,
}: {
  extension: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const category = getFileCategory(extension);
  const style = STYLES[category] ?? STYLES.other;
  const Icon = style.icon;
  const dimensions =
    size === "sm" ? "h-9 w-9 rounded-xl" : size === "lg" ? "h-16 w-16 rounded-2xl" : "h-12 w-12 rounded-2xl";
  const iconSize = size === "sm" ? "h-4 w-4" : size === "lg" ? "h-7 w-7" : "h-5 w-5";

  return (
    <span
      className={cn(
        "grid shrink-0 place-items-center dark:bg-white/10",
        dimensions,
        style.wrapper,
        className
      )}
      aria-hidden
    >
      <Icon className={iconSize} />
    </span>
  );
}
