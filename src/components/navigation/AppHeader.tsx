/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/utils";

export interface AppHeaderProps {
  username: string;
  avatarUrl?: string | null;
  className?: string;
}

export function AppHeader({ username, avatarUrl, className }: AppHeaderProps) {
  return (
    <header
      className={cn(
        "safe-top sticky top-0 z-40 border-b-2 border-line/70 bg-background/80 backdrop-blur-xl",
        className
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Logo size="sm" href="/home" />
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link
            href="/profile"
            aria-label="Open your profile"
            className="relative block rounded-full border-2 border-primary/40 shadow-toony-sm transition hover:-rotate-3 hover:border-primary/70"
          >
            <Avatar src={avatarUrl} name={username} size="md" />
          </Link>
        </div>
      </div>
    </header>
  );
}
