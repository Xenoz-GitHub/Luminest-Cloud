"use client";

import { useState } from "react";
import { Mascot } from "@/components/mascot/Mascot";
import { cn } from "@/lib/utils";

interface HeroMascotProps {
  className?: string;
}

export function HeroMascot({ className }: HeroMascotProps) {
  const [boop, setBoop] = useState(0);

  return (
    <button
      type="button"
      onClick={() => setBoop((value) => value + 1)}
      aria-label="Boop Lumi to make her wiggle"
      title="Boop Lumi to make her wiggle"
      className={cn(
        "group relative cursor-pointer touch-manipulation rounded-full outline-none focus-visible:ring-4 focus-visible:ring-primary/40",
        className
      )}
    >
      <span
        key={boop}
        className="block w-[min(300px,78vw)] animate-hero-shake motion-reduce:animate-none sm:w-[360px]"
      >
        <Mascot
          expression="excited"
          size={360}
          fluid
          priority
          glow
          animation="none"
          className="transition-transform duration-300 group-hover:scale-[1.03] group-active:scale-[0.98]"
        />
      </span>
      <span
        aria-hidden
        className="pointer-events-none absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full border-2 border-line bg-surface/90 px-2.5 py-0.5 text-[10px] font-bold text-muted opacity-0 shadow-toony-sm transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
      >
        boop me
      </span>
    </button>
  );
}
