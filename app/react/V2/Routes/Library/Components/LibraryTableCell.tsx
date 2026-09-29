import React from 'react';

type LibraryTableCellProps = {
  text: string;
  interactive?: boolean;
  onClick?: () => void;
  className?: string;
};

const EMPTY = '—';

const LibraryTableCell = ({
  text,
  interactive = false,
  onClick,
  className = '',
}: LibraryTableCellProps) => {
  const empty = !text;
  const display = empty ? EMPTY : text;
  const tone = empty ? 'text-ink-muted' : 'text-ink';

  if (interactive && !empty) {
    return (
      <button
        type="button"
        title={text}
        className={`min-w-0 truncate text-start text-ink underline-offset-2 hover:underline ${className}`}
        onClick={event => {
          event.stopPropagation();
          onClick?.();
        }}
      >
        {display}
      </button>
    );
  }

  return (
    <span title={empty ? undefined : text} className={`min-w-0 truncate ${tone} ${className}`}>
      {display}
    </span>
  );
};

export type { LibraryTableCellProps };
export { LibraryTableCell };
