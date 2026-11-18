"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Download,
  MoreVertical,
  Share,
  Smartphone,
  WifiOff,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

type Platform = "ios" | "android" | "desktop";

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

/**
 * Treat a device as "desktop" only when it looks like a real pointer-driven
 * machine. iPads report a Macintosh UA on iPadOS 13+, so a naive regex check
 * would wrongly show "install on this computer" on tablets — the touch-point
 * check prevents that.
 */
function isDesktopDevice(): boolean {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return false;
  }
  const ua = navigator.userAgent.toLowerCase();
  const maxTouch = navigator.maxTouchPoints || 0;
  // iPadOS masquerades as desktop Safari.
  if (/macintosh/.test(ua) && maxTouch > 1) return false;
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const fine = window.matchMedia("(pointer: fine)").matches;
  const hover = window.matchMedia("(hover: hover)").matches;
  const touch = maxTouch > 0 || "ontouchstart" in window;
  return fine && hover && !coarse && !touch;
}

function detectPlatform(): Platform {
  if (typeof navigator === "undefined") return "desktop";
  const ua = navigator.userAgent.toLowerCase();
  const maxTouch = navigator.maxTouchPoints || 0;
  if (/iphone|ipod/.test(ua) || (/macintosh/.test(ua) && maxTouch > 1)) {
    return "ios";
  }
  if (/android/.test(ua)) return "android";
  return "desktop";
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

export function InstallSection() {
  const [platform, setPlatform] = useState<Platform>("desktop");
  const [isDesktop, setIsDesktop] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [promptEvent, setPromptEvent] = useState<InstallPromptEvent | null>(null);
  const [sheet, setSheet] = useState<null | "ios" | "android" | "desktop">(null);

  useEffect(() => {
    setPlatform(detectPlatform());
    setIsDesktop(isDesktopDevice());
    setInstalled(isStandalone());

    const onPrompt = (event: Event) => {
      event.preventDefault();
      setPromptEvent(event as InstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setPromptEvent(null);
    };

    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  async function install(target: "ios" | "android" | "desktop") {
    // Chrome / Edge / Android can show the native install dialog.
    if (promptEvent) {
      await promptEvent.prompt();
      const choice = await promptEvent.userChoice;
      setPromptEvent(null);
      if (choice.outcome === "accepted") {
        setInstalled(true);
        return;
      }
    }
    // Otherwise explain the two-tap flow for this platform.
    setSheet(target);
  }

  return (
    <section
      id="install"
      aria-labelledby="install-heading"
      className="mt-16 scroll-mt-28 overflow-hidden rounded-[32px] border-2 border-primary/20 bg-gradient-to-br from-primary/10 via-surface to-softBlue/20 p-6 shadow-toony sm:mt-20 sm:p-10"
    >
      <div className="grid gap-8 lg:grid-cols-[1fr_1.05fr] lg:items-center">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-primary-deep dark:text-primary-soft">
            <Smartphone className="h-3.5 w-3.5" /> Install the app
          </span>
          <h2
            id="install-heading"
            className="mt-3 text-2xl font-extrabold tracking-tight text-ink sm:text-3xl"
          >
            Put LumiNest on your home screen
          </h2>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-muted">
            One tap and LumiNest opens full-screen — no address bar, no app
            store, with a little Lumi splash while it boots.
          </p>

          {installed ? (
            <div className="mt-5 inline-flex items-center gap-2 rounded-2xl border-2 border-[#7FC8A9]/40 bg-[#7FC8A9]/15 px-4 py-3 text-sm font-semibold text-[#2f7a5c] dark:text-[#a7e6cb]">
              <CheckCircle2 className="h-4 w-4" /> LumiNest is installed on this
              device.
            </div>
          ) : (
            <div className="mt-5 grid gap-2.5 sm:grid-cols-2">
              <InstallButton
                label="Install on iPhone"
                hint="Safari · Add to Home Screen"
                recommended={platform === "ios"}
                icon={<Share className="h-4 w-4" />}
                onClick={() => install("ios")}
              />
              <InstallButton
                label="Install on Android"
                hint="Chrome · Install app"
                recommended={platform === "android"}
                icon={<MoreVertical className="h-4 w-4" />}
                onClick={() => install("android")}
              />
            </div>
          )}

          {!installed && platform === "android" && (
            <p className="mt-3 text-xs text-muted">
              Older phone, or no &ldquo;Install app&rdquo; option?{" "}
              <Link
                href="/install-apk"
                className="font-semibold text-primary-deep hover:underline dark:text-primary-soft"
              >
                Download the APK
              </Link>
              .
            </p>
          )}

          {!installed && isDesktop && (
            <button
              type="button"
              onClick={() => install("desktop")}
              className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-primary-deep hover:underline dark:text-primary-soft"
            >
              <Download className="h-3.5 w-3.5" /> Or install on this computer
            </button>
          )}
        </div>

        <div className="rounded-3xl border-2 border-line bg-surface/90 p-5 shadow-toony">
          <p className="flex items-center gap-1.5 text-sm font-bold text-ink">
            <WifiOff className="h-4 w-4 text-primary-deep dark:text-primary-soft" />{" "}
            What works offline
          </p>
          <ul className="mt-3 space-y-2 text-xs leading-relaxed text-muted">
            <li className="flex gap-2">
              <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#4C9E79]" />
              The app opens to your pages you have already visited.
            </li>
            <li className="flex gap-2">
              <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#4C9E79]" />
              Summaries run on your device, so saved documents can be
              summarized with no connection.
            </li>
            <li className="flex gap-2">
              <WifiOff className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#B6923A]" />
              Uploading, syncing and sharing need a connection.
            </li>
          </ul>
        </div>
      </div>

      {sheet && (
        <InstallSheet platform={sheet} onClose={() => setSheet(null)} />
      )}
    </section>
  );
}

function InstallButton({
  label,
  hint,
  icon,
  recommended,
  onClick,
}: {
  label: string;
  hint: string;
  icon: React.ReactNode;
  recommended: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group flex items-center gap-3 rounded-2xl border-2 px-4 py-3 text-left shadow-toony-sm transition hover:-translate-y-0.5 hover:shadow-toony active:translate-y-0.5 active:shadow-none",
        recommended
          ? "border-primary/50 bg-primary/15"
          : "border-line bg-surface"
      )}
    >
      <span
        className={cn(
          "grid h-10 w-10 shrink-0 place-items-center rounded-xl",
          recommended
            ? "bg-primary/25 text-primary-deep dark:text-primary-soft"
            : "bg-surface2 text-muted"
        )}
      >
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-bold text-ink">{label}</span>
        <span className="block truncate text-[11px] text-muted">{hint}</span>
      </span>
    </button>
  );
}

function InstallSheet({
  platform,
  onClose,
}: {
  platform: "ios" | "android" | "desktop";
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [onClose]);

  const steps =
    platform === "ios"
      ? [
          "Open this page in Safari.",
          "Tap the Share button in the toolbar.",
          "Choose “Add to Home Screen”.",
          "Tap “Add” — LumiNest appears like a real app.",
        ]
      : platform === "android"
        ? [
            "Open this page in Chrome.",
            "Tap the three-dot menu, top right.",
            "Choose “Install app” (or “Add to Home screen”).",
            "Confirm — it opens full-screen from now on.",
          ]
        : [
            "Open this site in Chrome or Edge.",
            "Click the install icon in the address bar.",
            "Confirm “Install”.",
            "Launch it from your desktop or start menu.",
          ];

  const title =
    platform === "ios"
      ? "Add LumiNest to your iPhone"
      : platform === "android"
        ? "Install LumiNest on Android"
        : "Install LumiNest on desktop";

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center p-3 sm:items-center sm:p-6">
      <button
        type="button"
        aria-label="Close install instructions"
        className="absolute inset-0 bg-[#2b2138]/45 backdrop-blur-[3px]"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="animate-pop relative w-full max-w-md rounded-[28px] border-2 border-line bg-surface p-5 shadow-float"
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-ink">{title}</h3>
            <p className="mt-1 text-sm text-muted">
              Two taps and you are done — no app store needed.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full border-2 border-transparent text-muted transition hover:border-line hover:bg-surface2 hover:text-ink"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <ol className="space-y-2">
          {steps.map((step, index) => (
            <li
              key={step}
              className="flex gap-2.5 rounded-2xl border border-line bg-surface2/50 px-3 py-2.5 text-xs leading-relaxed text-ink"
            >
              <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary text-[10px] font-extrabold text-primary-ink">
                {index + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>

        <div className="mt-4">
          <Button onClick={onClose} className="w-full">
            Got it
          </Button>
        </div>
      </div>
    </div>
  );
}
