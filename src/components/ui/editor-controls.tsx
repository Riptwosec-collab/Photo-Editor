"use client";

import { useEffect, useId, useState, type ReactNode } from "react";
import { ChevronDown, RotateCcw } from "lucide-react";
import { DEFAULT_ADJUSTMENTS } from "@/features/editor/defaults";
import { useEditorStore } from "@/features/editor/store";
import type { AdjustmentKey } from "@/features/editor/types";
import { cn } from "@/lib/cn";

export function AccordionSection({
  id,
  title,
  subtitle,
  icon,
  badge,
  defaultOpen = false,
  forceOpen,
  actions,
  children,
}: {
  id: string;
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  badge?: string;
  defaultOpen?: boolean;
  forceOpen?: boolean;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  useEffect(() => {
    if (forceOpen) setOpen(true);
  }, [forceOpen]);
  return (
    <section className={cn("inspector-section", open && "open")} data-section={id}>
      <div className="inspector-section-head">
        <button
          type="button"
          className="inspector-section-toggle"
          aria-expanded={open}
          aria-controls={`${id}-content`}
          onClick={() => setOpen((value) => !value)}
        >
          <span className="inspector-section-icon">{icon}</span>
          <span className="inspector-section-copy">
            <strong>{title}</strong>
            {subtitle && <small>{subtitle}</small>}
          </span>
          {badge && <span className="section-badge">{badge}</span>}
          <ChevronDown className="section-chevron" size={15} />
        </button>
        {actions && <div className="inspector-section-actions">{actions}</div>}
      </div>
      {open && <div className="inspector-section-content" id={`${id}-content`}>{children}</div>}
    </section>
  );
}

export function AdjustmentSlider({
  adjustment,
  label,
  min,
  max,
  step = 1,
  unit = "",
  disabled = false,
}: {
  adjustment: AdjustmentKey;
  label: string;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  disabled?: boolean;
}) {
  const id = useId();
  const value = useEditorStore((state) => state.adjustments[adjustment]);
  const preview = useEditorStore((state) => state.previewAdjustment);
  const commit = useEditorStore((state) => state.commitAdjustments);
  const reset = useEditorStore((state) => state.resetAdjustment);
  const defaultValue = DEFAULT_ADJUSTMENTS[adjustment];
  const changed = value !== defaultValue;
  const decimals = step < 1 ? Math.max(1, `${step}`.split(".")[1]?.length ?? 1) : 0;

  function update(nextValue: number) {
    preview(adjustment, Math.max(min, Math.min(max, nextValue)));
  }

  return (
    <div className={cn("adjustment-control", changed && "changed", disabled && "disabled")}>
      <label htmlFor={id} className="adjustment-label">
        <span className="changed-dot" aria-hidden="true" />
        <span>{label}</span>
      </label>
      <div className="adjustment-value-wrap">
        <input
          aria-label={`${label} numeric value`}
          className="adjustment-number"
          type="number"
          min={min}
          max={max}
          step={step}
          value={Number(value.toFixed(decimals))}
          disabled={disabled}
          onChange={(event) => update(Number(event.target.value))}
          onBlur={commit}
          onKeyDown={(event) => {
            if (event.key === "Enter") event.currentTarget.blur();
          }}
        />
        {unit && <span className="adjustment-unit">{unit}</span>}
        <button
          type="button"
          className="mini-reset"
          title={`Reset ${label}`}
          aria-label={`Reset ${label}`}
          disabled={!changed || disabled}
          onClick={() => reset(adjustment)}
        >
          <RotateCcw size={12} />
        </button>
      </div>
      <input
        id={id}
        aria-label={label}
        className="professional-range"
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onDoubleClick={() => reset(adjustment)}
        onChange={(event) => update(Number(event.target.value))}
        onPointerUp={commit}
        onKeyUp={commit}
        onKeyDown={(event) => {
          if (!event.shiftKey || !["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) return;
          event.preventDefault();
          const direction = event.key === "ArrowRight" || event.key === "ArrowUp" ? 1 : -1;
          update(value + direction * step * 0.1);
          commit();
        }}
      />
    </div>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
  description,
  disabled = false,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      className={cn("toggle-row", checked && "checked")}
      onClick={() => onChange(!checked)}
      disabled={disabled}
    >
      <span className="toggle-copy"><strong>{label}</strong>{description && <small>{description}</small>}</span>
      <span className="toggle-track"><span className="toggle-thumb" /></span>
    </button>
  );
}

export function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
  ariaLabel,
}: {
  value: T;
  options: Array<{ value: T; label: string; disabled?: boolean }>;
  onChange: (value: T) => void;
  ariaLabel: string;
}) {
  return (
    <div className="segmented-control" role="group" aria-label={ariaLabel}>
      {options.map((option) => (
        <button
          type="button"
          key={option.value}
          className={value === option.value ? "active" : ""}
          aria-pressed={value === option.value}
          disabled={option.disabled}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function ProgressBar({ value, label }: { value: number; label?: string }) {
  return (
    <div className="progress-block" aria-label={label ?? "Progress"}>
      <div className="progress-meta"><span>{label ?? "Processing"}</span><output>{Math.round(value)}%</output></div>
      <div className="progress-track"><span style={{ width: `${Math.max(0, Math.min(100, value))}%` }} /></div>
    </div>
  );
}
