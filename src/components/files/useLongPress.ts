"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface LongPressOptions {
  delay?: number;
  onLongPress: () => void;
  disabled?: boolean;
}

/**
 * Pointer-based long press with movement cancellation. Keyboard and
 * right-click alternatives are provided by the consuming component.
 */
export function useLongPress({
  delay = 520,
  onLongPress,
  disabled = false,
}: LongPressOptions) {
  const timer = useRef<number | null>(null);
  const triggered = useRef(false);
  const start = useRef<{ x: number; y: number } | null>(null);
  const [pressing, setPressing] = useState(false);

  const clear = useCallback(() => {
    if (timer.current !== null) {
      window.clearTimeout(timer.current);
      timer.current = null;
    }
    start.current = null;
    setPressing(false);
  }, []);

  useEffect(() => clear, [clear]);

  const onPointerDown = useCallback(
    (event: React.PointerEvent) => {
      if (disabled) return;
      if (event.pointerType === "mouse" && event.button !== 0) return;
      triggered.current = false;
      start.current = { x: event.clientX, y: event.clientY };
      setPressing(true);
      if (timer.current !== null) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => {
        triggered.current = true;
        setPressing(false);
        timer.current = null;
        onLongPress();
      }, delay);
    },
    [delay, disabled, onLongPress]
  );

  const onPointerMove = useCallback(
    (event: React.PointerEvent) => {
      if (!start.current) return;
      const dx = event.clientX - start.current.x;
      const dy = event.clientY - start.current.y;
      if (Math.hypot(dx, dy) > 10) clear();
    },
    [clear]
  );

  const onContextMenu = useCallback(
    (event: React.MouseEvent) => {
      if (disabled) return;
      event.preventDefault();
      triggered.current = true;
      clear();
      onLongPress();
    },
    [clear, disabled, onLongPress]
  );

  return {
    pressing,
    wasLongPress: () => triggered.current,
    cancel: clear,
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp: clear,
      onPointerCancel: clear,
      onPointerLeave: clear,
      onContextMenu,
    },
  };
}
