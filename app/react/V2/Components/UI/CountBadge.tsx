import React from 'react';

type CountBadgeProps = {
  count: number;
  label?: string;
};

const CountBadge = ({ count, label }: CountBadgeProps) => (
  <span
    data-component="CountBadge"
    title={label}
    className="inline-flex h-5 min-w-[20px] shrink-0 items-center justify-center rounded-md bg-parchment px-1.5 text-xs font-medium text-ink-tertiary"
  >
    <span aria-hidden={label ? true : undefined}>{count.toLocaleString()}</span>
    {label ? <span className="sr-only">{label}</span> : null}
  </span>
);

export type { CountBadgeProps };
export { CountBadge };
