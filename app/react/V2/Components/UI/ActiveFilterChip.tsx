import React, { type ReactNode } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { ColorDot } from './ColorDot.js';
import { IconButton } from './IconButton.js';

type ActiveFilterChipProps = {
  label: ReactNode;
  color?: string;
  onRemove: () => void;
  removeAriaLabel?: string;
};

const ActiveFilterChip = ({ label, color, onRemove, removeAriaLabel }: ActiveFilterChipProps) => (
  <span className="inline-flex h-6 max-w-[160px] items-center gap-1 truncate rounded border border-border/60 bg-[color-mix(in_srgb,var(--color-theme-ink)_6%,var(--color-theme-bg-surface))] pl-1.5 pr-1 text-[11px] font-medium text-ink-secondary">
    {color && <ColorDot color={color} />}
    <span className="truncate">{label}</span>
    <IconButton variant="chip" onClick={onRemove} aria-label={removeAriaLabel ?? 'Remove filter'}>
      <XMarkIcon className="h-2.5 w-2.5" />
    </IconButton>
  </span>
);

export { ActiveFilterChip };
