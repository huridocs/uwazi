import React from 'react';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import { Translate } from '#app/I18N/index.js';

interface MultiselectListButtonItemProps {
  children: React.ReactNode;
  isOpen: boolean;
  foldable: boolean;
  label: string | React.ReactNode;
  itemContainerClassName?: string;
  itemClassName?: string;
  onClick: () => void;
  plain?: boolean;
}

const MultiselectListGroup = ({
  children,
  isOpen,
  foldable,
  label,
  onClick,
  itemContainerClassName,
  itemClassName,
  plain = false,
}: MultiselectListButtonItemProps) => {
  const foldableHeaderBg = isOpen ? 'bg-parchment' : 'bg-warm';

  if (foldable) {
    return (
      <li className={`${itemClassName ?? (plain ? 'mb-2' : 'mb-2 rounded-md bg-warm')}`}>
        <div
          className={`mb-1 flex cursor-pointer items-center justify-between gap-2 rounded-md px-2.5 py-2 ${
            plain ? '' : foldableHeaderBg
          }`}
          onClick={onClick}
        >
          <span className="block text-sm font-semibold text-ink">{label}</span>
          <button
            className="flex flex-row items-center justify-center gap-1 rounded-md bg-carbon/10 px-1.5 py-0.5 text-xs font-medium text-ink-secondary"
            type="button"
            onClick={event => {
              event.stopPropagation();
              onClick();
            }}
          >
            <div className="h-3 w-3 text-sm">
              {isOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
            </div>
            <Translate>Group</Translate>
          </button>
        </div>
        {isOpen && (
          <ul className={`${itemContainerClassName ?? 'flex flex-col gap-1 ps-3'}`}>{children}</ul>
        )}
      </li>
    );
  }

  return (
    <li className={`${itemClassName ?? (plain ? 'mb-2' : 'mb-2 rounded-md bg-warm px-2.5 py-2')}`}>
      <span className="mb-1.5 block text-sm font-semibold text-ink">{label}</span>
      <ul className={`${itemContainerClassName ?? 'flex flex-col gap-1'}`}>{children}</ul>
    </li>
  );
};

export { MultiselectListGroup };
