"use client";

import { forwardRef } from "react";
import { Loader2 } from "lucide-react";
import {
  buttonStyles,
  type ButtonSize,
  type ButtonVariant,
} from "@/lib/button-styles";

export type Variant = ButtonVariant;
export type Size = ButtonSize;

export { buttonStyles };

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  loadingLabel?: string;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      loadingLabel = "Working…",
      className,
      children,
      disabled,
      type = "button",
      ...props
    },
    ref
  ) => (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={buttonStyles(variant, size, className)}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
      {loading ? loadingLabel : children}
    </button>
  )
);
Button.displayName = "Button";
