import React, { type ReactNode } from 'react';
import { Translate } from '#app/I18N/index.js';

const barLeadClassName = 'text-ink font-medium hover:bg-warm';
const barGhostClassName = 'text-ink-secondary hover:bg-warm hover:text-ink';
const barDangerClassName = 'text-seal-label hover:bg-seal-tint/40';

const barButtonClassName =
  'shrink-0 cursor-pointer items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors disabled:cursor-default disabled:opacity-40 disabled:hover:bg-transparent sm:px-3';

type BarTone = 'lead' | 'ghost' | 'danger';

const barToneClass = (tone: BarTone) => {
  if (tone === 'lead') {
    return barLeadClassName;
  }
  if (tone === 'danger') {
    return barDangerClassName;
  }
  return barGhostClassName;
};

type LibrarySelectionBarButtonProps = {
  icon: ReactNode;
  label: string;
  tone: BarTone;
  onClick?: () => void;
  disabled?: boolean;
  title?: string;
};

const LibrarySelectionBarButton = ({
  icon,
  label,
  tone,
  onClick,
  disabled = false,
  title,
}: LibrarySelectionBarButtonProps) => (
  <button
    key={label}
    type="button"
    aria-label={label}
    title={title}
    disabled={disabled}
    onClick={disabled ? undefined : onClick}
    className={`inline-flex ${barButtonClassName} ${barToneClass(tone)}`}
  >
    <span className={tone === 'danger' ? 'text-seal' : 'text-ink-tertiary'}>{icon}</span>
    <span className="sm:inline">
      <Translate>{label}</Translate>
    </span>
  </button>
);

export type { BarTone, LibrarySelectionBarButtonProps };
export { LibrarySelectionBarButton };
