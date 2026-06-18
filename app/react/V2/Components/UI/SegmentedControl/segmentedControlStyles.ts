const segmentRootClass = (disabled: boolean, className = ''): string =>
  [
    'inline-flex w-fit max-w-full items-center overflow-hidden rounded-md border border-border',
    '[&>button:not(:first-child)]:border-l [&>button:not(:first-child)]:border-border',
    disabled ? 'opacity-60' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

const segmentItemClass = (active: boolean, disabled: boolean, className = ''): string => {
  const parts = [
    'flex h-6 shrink-0 items-center justify-center gap-1 px-2 text-[11px] font-medium transition-colors',
  ];
  if (disabled) parts.push('cursor-not-allowed text-ink-muted');
  else if (active) parts.push('cursor-pointer bg-vellum text-ink');
  else parts.push('cursor-pointer text-ink-tertiary hover:bg-warm hover:text-ink-secondary');
  if (className) parts.push(className);
  return parts.join(' ');
};

export { segmentItemClass, segmentRootClass };
