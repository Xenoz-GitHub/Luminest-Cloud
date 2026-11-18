"use client";

import { forwardRef, useId } from "react";
import { cn } from "@/lib/utils";

interface FieldShellProps {
  label?: string;
  hint?: string;
  error?: string;
  htmlFor?: string;
  children: React.ReactNode;
  className?: string;
}

export function FieldShell({
  label,
  hint,
  error,
  htmlFor,
  children,
  className,
}: FieldShellProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      {label && (
        <label
          htmlFor={htmlFor}
          className="block text-sm font-bold text-ink"
        >
          {label}
        </label>
      )}
      {children}
      {error ? (
        <p className="text-xs font-medium text-[#a34b60] dark:text-[#f3b3c0]" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-muted">{hint}</p>
      ) : null}
    </div>
  );
}

export const inputStyles =
  "w-full rounded-2xl border-2 border-line bg-surface px-4 py-3 text-sm text-ink placeholder:text-muted/70 shadow-toony-sm outline-none transition focus:border-primary focus:shadow-none focus:ring-4 focus:ring-primary/15 disabled:opacity-60";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
  containerClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, hint, error, className, containerClassName, id, ...props }, ref) => {
    const generated = useId();
    const inputId = id ?? generated;
    return (
      <FieldShell
        label={label}
        hint={hint}
        error={error}
        htmlFor={inputId}
        className={containerClassName}
      >
        <input
          ref={ref}
          id={inputId}
          aria-invalid={error ? true : undefined}
          className={cn(inputStyles, className)}
          {...props}
        />
      </FieldShell>
    );
  }
);
Input.displayName = "Input";

interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, hint, error, className, id, ...props }, ref) => {
    const generated = useId();
    const inputId = id ?? generated;
    return (
      <FieldShell label={label} hint={hint} error={error} htmlFor={inputId}>
        <textarea
          ref={ref}
          id={inputId}
          className={cn(inputStyles, "min-h-28 resize-y", className)}
          {...props}
        />
      </FieldShell>
    );
  }
);
Textarea.displayName = "Textarea";
