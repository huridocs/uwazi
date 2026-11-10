import React, { useId, useRef, useState } from 'react';
import { ChevronUpIcon } from '@heroicons/react/20/solid';
import { t, Translate } from '#app/I18N/index.js';
import { LibraryFooterButton } from './LibraryFooterButton.js';
import { LibraryFooterMenu } from './LibraryFooterMenu.js';
import { iconClassName, menuItemClassName } from './libraryResultsFooterActions.js';

const usesCommandKey = () => {
  const platform = typeof navigator === 'undefined' ? '' : navigator.platform || '';
  const agent = typeof navigator === 'undefined' ? '' : navigator.userAgent || '';
  return /Mac|iPhone|iPad/i.test(`${platform} ${agent}`);
};

type LibrarySelectMenuProps = {
  pageCount: number;
  selectedCount?: number;
  onSelectPage?: () => void;
  onClear?: () => void;
  onChosen?: () => void;
  withTrigger?: boolean;
};

const LibrarySelectMenu = ({
  pageCount,
  selectedCount = 0,
  onSelectPage,
  onClear,
  onChosen,
  withTrigger = false,
}: LibrarySelectMenuProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const selecting = selectedCount > 0;
  const label = selecting
    ? `${selectedCount.toLocaleString()} ${t('System', 'selected', null, false)}`
    : t('System', 'Select', null, false);
  const choose = () => {
    if (!selecting && pageCount === 0) {
      return;
    }
    if (withTrigger) {
      setOpen(false);
    } else {
      onChosen?.();
    }
    if (selecting) {
      onClear?.();
      return;
    }
    onSelectPage?.();
  };
  const items = (
    <>
      <div data-testid="library-cherrypick-hint" className="px-3 pt-2">
        <p className="text-xs font-medium text-ink">
          <Translate>Cherrypick</Translate>
        </p>
        <p className="mt-0.5 max-w-64 text-xs text-ink-tertiary">
          {usesCommandKey() ? (
            <Translate>Click records to add them. Cmd + click works anytime.</Translate>
          ) : (
            <Translate>Click records to add them. Ctrl + click works anytime.</Translate>
          )}
        </p>
      </div>
      <div data-testid="library-range-hint" className="px-3 py-2">
        <p className="text-xs font-medium text-ink">
          <Translate>Range</Translate>
        </p>
        <p className="mt-0.5 max-w-64 text-xs text-ink-tertiary">
          <Translate>
            Hold Shift and click to select from the last record through this one.
          </Translate>
        </p>
      </div>
      {selecting ? (
        <button type="button" role="menuitem" className={menuItemClassName} onClick={choose}>
          <Translate>Clear selection</Translate>
        </button>
      ) : (
        <button
          type="button"
          role="menuitem"
          disabled={pageCount === 0}
          className={`${menuItemClassName} disabled:cursor-default disabled:opacity-40`}
          onClick={choose}
        >
          <Translate>Select this page</Translate>
          {` (${pageCount.toLocaleString()})`}
        </button>
      )}
    </>
  );
  if (!withTrigger) {
    return items;
  }
  return (
    <div
      className="relative shrink-0"
      ref={ref}
      data-testid={selecting ? 'library-selected-count' : undefined}
    >
      <LibraryFooterButton
        icon={<ChevronUpIcon className={`${iconClassName} order-last`} />}
        name={label}
        onClick={() => setOpen(current => !current)}
        expanded={open}
        popup="menu"
        controls={menuId}
      >
        {selecting ? (
          <span className="whitespace-nowrap">
            <span className="tabular-nums">{selectedCount.toLocaleString()}</span>{' '}
            <Translate>selected</Translate>
          </span>
        ) : (
          <Translate>Select</Translate>
        )}
      </LibraryFooterButton>
      <LibraryFooterMenu
        open={open}
        onClose={() => setOpen(false)}
        anchorRef={ref}
        label={label}
        menuId={menuId}
        prefer="start"
      >
        {items}
      </LibraryFooterMenu>
    </div>
  );
};

export type { LibrarySelectMenuProps };
export { LibrarySelectMenu };
