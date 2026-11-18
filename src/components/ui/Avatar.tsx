"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { initials } from "@/lib/format";

interface AvatarProps {
  src?: string | null;
  /** Name used to derive the fallback initials. */
  name: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  /**
   * Google profile pictures are signed URLs that can expire, and any remote
   * avatar can fail (blocked host, offline, deleted image). When that happens
   * we render initials instead of leaving the browser's broken-image icon.
   */
  alt?: string;
}

const SIZES = {
  sm: "h-9 w-9 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-sm",
} as const;

export function Avatar({
  src,
  name,
  size = "md",
  className,
  alt = "",
}: AvatarProps) {
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(src) && !failed;

  return (
    <span
      className={cn(
        "grid shrink-0 place-items-center overflow-hidden rounded-full bg-primary/20 font-bold text-primary-deep dark:text-primary-soft",
        SIZES[size],
        className
      )}
    >
      {showImage ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={src as string}
          alt={alt}
          className="h-full w-full object-cover"
          referrerPolicy="no-referrer"
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
        />
      ) : (
        initials(name)
      )}
    </span>
  );
}
