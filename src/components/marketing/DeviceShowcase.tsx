"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { cn } from "@/lib/utils";

interface Slide {
  src: string;
  label: string;
  caption: string;
}

const PHONE_SLIDES: Slide[] = [
  {
    src: "/showcase/phone-1.webp",
    label: "Your library",
    caption: "Every file in one cozy, searchable nest.",
  },
  {
    src: "/showcase/phone-2.webp",
    label: "Instant previews",
    caption: "Pages, slides and photos render the moment they land.",
  },
  {
    src: "/showcase/phone-3.webp",
    label: "Lumi’s summaries",
    caption: "Clear overviews, key ideas and dates — even offline.",
  },
];

const DESKTOP_SLIDES: Slide[] = [
  {
    src: "/showcase/desktop-1.webp",
    label: "Dashboard",
    caption: "Storage, recent files and quick actions at a glance.",
  },
  {
    src: "/showcase/desktop-2.webp",
    label: "File details",
    caption: "Preview, summarize, tag and share without leaving the page.",
  },
  {
    src: "/showcase/desktop-3.webp",
    label: "Organize",
    caption: "Folders, filters and favorites keep everything tidy.",
  },
];

const AUTOPLAY_MS = 4500;

function useCarousel(length: number) {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [paused, setPaused] = useState(false);
  const timer = useRef<number | null>(null);

  const go = useCallback(
    (next: number) => setIndex(((next % length) + length) % length),
    [length]
  );

  useEffect(() => {
    if (!playing || paused) return;
    timer.current = window.setTimeout(() => go(index + 1), AUTOPLAY_MS);
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [index, playing, paused, go]);

  return {
    index,
    playing,
    go,
    next: () => go(index + 1),
    prev: () => go(index - 1),
    toggle: () => setPlaying((value) => !value),
    pause: () => setPaused(true),
    resume: () => setPaused(false),
  };
}

export function DeviceShowcase() {
  const phone = useCarousel(PHONE_SLIDES.length);
  const desktop = useCarousel(DESKTOP_SLIDES.length);

  return (
    <section
      id="showcase"
      aria-labelledby="showcase-heading"
      className="mt-12 scroll-mt-28 sm:mt-20"
    >
      <div className="mb-6 text-center sm:mb-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary-deep dark:text-primary-soft">
          A peek inside
        </p>
        <h2
          id="showcase-heading"
          className="mt-2 text-2xl font-extrabold tracking-tight text-ink sm:text-3xl"
        >
          The same nest, on every screen.
        </h2>
        <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-ink/70">
          Designed mobile-first, then opened up wide for the desktop.
        </p>
      </div>

      <div className="grid items-center gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:gap-8">
        {/* Phone — the only mockup shown below lg. A 1600px desktop screenshot is
            illegible on a 390px phone and roughly doubled the page height. */}
        <div
          className="order-1 flex min-w-0 justify-center px-2"
          onMouseEnter={phone.pause}
          onMouseLeave={phone.resume}
          onFocusCapture={phone.pause}
          onBlurCapture={phone.resume}
        >
          {/* Width is defined here, once, so the phone and its controls always
              share the same width and the buttons can never overflow it. */}
          <div className="relative w-full max-w-[220px] sm:max-w-[248px] lg:max-w-[276px]">
            <div
              aria-hidden
              className="absolute inset-x-6 bottom-2 h-24 rounded-full bg-primary/25 blur-2xl"
            />
            <div className="group relative w-full rounded-[2.4rem] border-[7px] border-[#2a2136] bg-[#2a2136] shadow-[0_36px_60px_-28px_rgba(42,33,54,0.65)] transition-transform duration-500 ease-out lg:[transform:perspective(1400px)_rotateY(14deg)_rotateX(6deg)] lg:hover:[transform:perspective(1400px)_rotateY(6deg)_rotateX(3deg)_translateY(-6px)]">
              <div className="absolute left-1/2 top-2 z-20 h-5 w-20 -translate-x-1/2 rounded-full bg-[#1b1426]" />
              <div className="relative aspect-[990/1816] w-full overflow-hidden rounded-[1.95rem] bg-surface">
                {PHONE_SLIDES.map((slide, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={slide.src}
                    src={slide.src}
                    alt={`${slide.label} screen`}
                    draggable={false}
                    loading={i === 0 ? "eager" : "lazy"}
                    className={cn(
                      "absolute inset-0 h-full w-full object-cover transition-all duration-700 ease-out",
                      i === phone.index
                        ? "opacity-100 scale-100"
                        : "opacity-0 scale-[1.04]"
                    )}
                  />
                ))}
              </div>
            </div>

            <CarouselControls
              slide={PHONE_SLIDES[phone.index]}
              index={phone.index}
              length={PHONE_SLIDES.length}
              playing={phone.playing}
              onPrev={phone.prev}
              onNext={phone.next}
              onToggle={phone.toggle}
              onSelect={phone.go}
              align="center"
            />
          </div>
        </div>

        {/* Desktop — only from lg upward, where the detail is legible. */}
        <div
          className="order-2 hidden min-w-0 lg:block"
          onMouseEnter={desktop.pause}
          onMouseLeave={desktop.resume}
          onFocusCapture={desktop.pause}
          onBlurCapture={desktop.resume}
        >
          <div className="group relative">
            <div className="relative overflow-hidden rounded-2xl border-[6px] border-[#2a2136] bg-[#2a2136] shadow-[0_40px_70px_-30px_rgba(42,33,54,0.6)] transition-transform duration-500 ease-out lg:[transform:perspective(1600px)_rotateY(-8deg)] lg:hover:[transform:perspective(1600px)_rotateY(-3deg)_translateY(-4px)]">
              <div className="relative aspect-[1600/1000] w-full overflow-hidden rounded-md bg-surface">
                {DESKTOP_SLIDES.map((slide, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={slide.src}
                    src={slide.src}
                    alt={`${slide.label} screen`}
                    draggable={false}
                    loading={i === 0 ? "eager" : "lazy"}
                    className={cn(
                      "absolute inset-0 h-full w-full object-cover transition-all duration-700 ease-out",
                      i === desktop.index
                        ? "opacity-100 scale-100"
                        : "opacity-0 scale-[1.03]"
                    )}
                  />
                ))}
              </div>
            </div>
            <div
              aria-hidden
              className="mx-auto mt-1 h-3 w-1/3 rounded-b-2xl bg-[#2a2136]/80"
            />

            <CarouselControls
              slide={DESKTOP_SLIDES[desktop.index]}
              index={desktop.index}
              length={DESKTOP_SLIDES.length}
              playing={desktop.playing}
              onPrev={desktop.prev}
              onNext={desktop.next}
              onToggle={desktop.toggle}
              onSelect={desktop.go}
              align="between"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function CarouselControls({
  slide,
  index,
  length,
  playing,
  onPrev,
  onNext,
  onToggle,
  onSelect,
  align,
}: {
  slide: Slide;
  index: number;
  length: number;
  playing: boolean;
  onPrev: () => void;
  onNext: () => void;
  onToggle: () => void;
  onSelect: (index: number) => void;
  align: "center" | "between";
}) {
  return (
    <div className="mt-4">
      <div
        className={cn(
          "flex items-center gap-2 sm:gap-3",
          align === "center" ? "justify-center" : "justify-between"
        )}
      >
        <button
          type="button"
          onClick={onPrev}
          aria-label="Previous screenshot"
          className="grid h-8 w-8 shrink-0 place-items-center rounded-full border-2 border-line bg-surface text-ink shadow-toony-sm transition hover:border-primary/40 hover:bg-surface2 active:translate-y-0.5 active:shadow-none sm:h-9 sm:w-9"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <div className="min-w-0 flex-1 text-center">
          <p className="truncate text-xs font-bold text-ink sm:text-sm">
            {slide.label}
          </p>
          <p className="line-clamp-2 text-[11px] leading-snug text-muted sm:truncate sm:text-xs">
            {slide.caption}
          </p>
        </div>

        <button
          type="button"
          onClick={onToggle}
          aria-label={playing ? "Pause slideshow" : "Play slideshow"}
          className="grid h-8 w-8 shrink-0 place-items-center rounded-full border-2 border-line bg-surface text-ink shadow-toony-sm transition hover:border-primary/40 hover:bg-surface2 active:translate-y-0.5 active:shadow-none sm:h-9 sm:w-9"
        >
          {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
        </button>

        <button
          type="button"
          onClick={onNext}
          aria-label="Next screenshot"
          className="grid h-8 w-8 shrink-0 place-items-center rounded-full border-2 border-line bg-surface text-ink shadow-toony-sm transition hover:border-primary/40 hover:bg-surface2 active:translate-y-0.5 active:shadow-none sm:h-9 sm:w-9"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div
        role="tablist"
        aria-label="Choose screenshot"
        className={cn("mt-3 flex gap-1.5", align === "center" && "justify-center")}
      >
        {Array.from({ length }).map((_, i) => (
          <button
            key={i}
            type="button"
            role="tab"
            aria-selected={i === index}
            aria-label={`Screenshot ${i + 1}`}
            onClick={() => onSelect(i)}
            className={cn(
              "h-1.5 rounded-full transition-all duration-300",
              i === index
                ? "w-7 bg-primary"
                : "w-3 bg-line hover:bg-primary/40"
            )}
          />
        ))}
      </div>
    </div>
  );
}
