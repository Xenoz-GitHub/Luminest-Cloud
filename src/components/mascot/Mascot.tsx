import Image from "next/image";
import { cn } from "@/lib/utils";

export type MascotExpression =
  | "happy"
  | "excited"
  | "curious"
  | "thinking"
  | "sad"
  | "angry"
  | "loading"
  | "sleepy"
  | "surprised"
  | "love"
  | "shy"
  | "confused"
  | "cheerful";

export type MascotState =
  | "welcome"
  | "empty-library"
  | "empty-folder"
  | "uploading"
  | "upload-success"
  | "processing"
  | "generating-summary"
  | "no-results"
  | "file-not-found"
  | "error"
  | "sharing-success"
  | "storage-full";

export type MascotPose =
  | "holding-files"
  | "uploading"
  | "sharing"
  | "reading"
  | "organizing"
  | "searching"
  | "relaxing"
  | "celebrating"
  | "summarizing"
  | "welcoming";

const ASPECTS: Record<string, number> = {
  happy: 0.617,
  excited: 0.662,
  curious: 0.701,
  thinking: 0.666,
  sad: 0.646,
  angry: 0.653,
  loading: 0.808,
  sleepy: 0.808,
  surprised: 0.701,
  love: 0.617,
  shy: 0.617,
  confused: 0.666,
  cheerful: 0.662,
};

const ALT: Record<string, string> = {
  happy: "A happy cloud-bunny holding a purple notebook",
  excited: "An excited cloud-bunny celebrating",
  curious: "A curious cloud-bunny wondering about something",
  thinking: "A thoughtful cloud-bunny with a lightbulb",
  sad: "A sad cloud-bunny",
  angry: "A grumpy cloud-bunny",
  loading: "A sleepy cloud-bunny waiting patiently",
  sleepy: "A sleepy cloud-bunny",
  surprised: "A surprised cloud-bunny",
  love: "A loving cloud-bunny",
  shy: "A shy cloud-bunny",
  confused: "A confused cloud-bunny",
  cheerful: "A cheerful cloud-bunny",
};

interface MascotProps {
  expression?: MascotExpression;
  state?: MascotState;
  pose?: MascotPose;
  size?: number;
  className?: string;
  imgClassName?: string;
  decorative?: boolean;
  priority?: boolean;
  animation?: "float" | "wiggle" | "none";
  glow?: boolean;
  fluid?: boolean;
}

export function Mascot({
  expression = "happy",
  state,
  pose,
  size = 160,
  className,
  imgClassName,
  decorative = false,
  priority = false,
  animation = "float",
  glow = false,
  fluid = false,
}: MascotProps) {
  const kind = state ? "states" : pose ? "poses" : "expressions";
  const name = state ?? pose ?? expression;
  const aspect = ASPECTS[expression] ?? 0.66;
  const width = Math.max(1, Math.round(size * aspect));

  return (
    <span
      className={cn(
        "relative inline-flex items-center justify-center",
        fluid && "w-full",
        animation === "float" && "animate-float",
        animation === "wiggle" && "animate-wiggle",
        className
      )}
      style={fluid ? { aspectRatio: `${width} / ${size}` } : { width, height: size }}
    >
      {glow && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 rounded-full bg-primary/25 blur-3xl"
        />
      )}
      <Image
        src={`/mascot/${kind}/${name}.png`}
        alt={decorative ? "" : ALT[name] ?? "LumiNest's cloud-bunny mascot"}
        width={width}
        height={size}
        priority={priority}
        className={cn("h-full w-full object-contain drop-shadow-sm", imgClassName)}
      />
    </span>
  );
}
