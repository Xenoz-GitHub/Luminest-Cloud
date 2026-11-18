import Image from "next/image";
import Link from "next/link";
import { APP_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface LogoProps {
  href?: string | null;
  size?: "sm" | "md" | "lg";
  showWordmark?: boolean;
  className?: string;
}

export function Logo({
  href = "/",
  size = "md",
  showWordmark = true,
  className,
}: LogoProps) {
  const dimensions = size === "sm" ? 32 : size === "lg" ? 52 : 40;
  const content = (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <span
        className="relative grid shrink-0 place-items-center rounded-2xl shadow-[0_3px_0_rgba(80,68,101,0.18)] transition-transform duration-200 group-hover:-rotate-3"
        style={{ width: dimensions, height: dimensions }}
      >
        <Image
          src="/branding/luminest-icon.svg"
          alt=""
          width={dimensions}
          height={dimensions}
          className="rounded-2xl"
          priority
          unoptimized
        />
      </span>
      {showWordmark && (
        <span className="flex flex-col leading-none">
          <span
            className={cn(
              "font-extrabold tracking-tight text-ink",
              size === "lg" ? "text-2xl" : size === "sm" ? "text-base" : "text-xl"
            )}
          >
            {APP_NAME}
          </span>
          {size === "lg" && (
            <span className="mt-1 text-xs font-medium text-muted">
              Your little space for everything.
            </span>
          )}
        </span>
      )}
    </span>
  );

  if (!href) return content;
  return (
    <Link href={href} aria-label={`${APP_NAME} home`} className="group inline-flex">
      {content}
    </Link>
  );
}
