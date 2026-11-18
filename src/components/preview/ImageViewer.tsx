"use client";

import { useState } from "react";
import { Maximize2, Minus, Plus } from "lucide-react";

interface ImageViewerProps {
  url: string;
  title: string;
}

const STEPS = [1, 1.5, 2, 3];

export function ImageViewer({ url, title }: ImageViewerProps) {
  const [step, setStep] = useState(0);
  const scale = STEPS[step];

  return (
    <div>
      <div className="relative overflow-auto rounded-2xl border border-line bg-gradient-to-br from-primary/5 via-surface2 to-softBlue/20">
        <div className="min-h-[16rem]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={url}
            alt={title}
            style={{
              width: scale === 1 ? "100%" : `${scale * 100}%`,
              maxWidth: scale === 1 ? "100%" : "none",
            }}
            className="mx-auto h-auto object-contain"
          />
        </div>
        <div className="sticky bottom-2 left-0 mt-2 flex justify-center">
          <div className="flex items-center gap-1 rounded-full border border-line bg-surface/90 p-1 shadow-float backdrop-blur">
            <button
              type="button"
              onClick={() => setStep((value) => Math.max(0, value - 1))}
              disabled={step === 0}
              aria-label="Zoom out"
              className="grid h-8 w-8 place-items-center rounded-full text-ink transition hover:bg-surface2 disabled:opacity-40"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <span className="min-w-12 text-center text-[10px] font-bold text-muted">
              {Math.round(scale * 100)}%
            </span>
            <button
              type="button"
              onClick={() =>
                setStep((value) => Math.min(STEPS.length - 1, value + 1))
              }
              disabled={step === STEPS.length - 1}
              aria-label="Zoom in"
              className="grid h-8 w-8 place-items-center rounded-full text-ink transition hover:bg-surface2 disabled:opacity-40"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setStep(0)}
              aria-label="Fit image to screen"
              className="grid h-8 w-8 place-items-center rounded-full text-ink transition hover:bg-surface2"
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
