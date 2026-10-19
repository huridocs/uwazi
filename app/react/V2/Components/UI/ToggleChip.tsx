import React from 'react';

type ToggleChipProps = {
  label: string;
  count?: number;
  active: boolean;
  onToggle: () => void;
};

const ToggleChip = ({ label, count, active, onToggle }: ToggleChipProps) => (
  <button
    type="button"
    onClick={onToggle}
    aria-pressed={active}
    aria-label={count === undefined ? label : `${label} ${count.toLocaleString()}`}
    className={`inline-flex h-6 cursor-pointer items-center gap-1 rounded ps-1.5 pe-1.5 text-meta font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ink ${
      active ? 'text-ink-secondary' : 'text-ink-tertiary hover:text-ink-secondary'
    }`}
    style={{
      backgroundColor: active
        ? 'color-mix(in srgb, var(--text-primary) 6%, var(--bg-surface))'
        : 'transparent',
      border: `1px solid color-mix(in srgb, var(--text-primary) ${active ? 14 : 8}%, var(--bg-surface))`,
    }}
  >
    <span className="max-w-40 truncate">{label}</span>
    {count !== undefined ? (
      <span aria-hidden className="shrink-0 tabular-nums text-ink-tertiary">
        {count.toLocaleString()}
      </span>
    ) : null}
  </button>
);

export type { ToggleChipProps };
export { ToggleChip };
