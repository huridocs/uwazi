import React from 'react';
import { EllipsisHorizontalIcon } from '@heroicons/react/24/outline';
import { Translate } from '#app/I18N/index.js';
import { NeedAuthorization } from '#V2/Components/UI/NeedAuthorization.js';
import { useIsMobile } from '#V2/CustomHooks/useIsMobile.js';
import { LibraryFooterButton } from './LibraryFooterButton.js';
import { LibraryFooterMenu } from './LibraryFooterMenu.js';
import {
  editorRoles,
  iconClassName,
  menuItemClassName,
  renderActionItems,
  renderPdfFileInput,
} from './libraryResultsFooterActions.js';
import { useLibraryResultsFooterMenus } from './useLibraryResultsFooterMenus.js';

type LibraryResultsFooterProps = {
  onCreateEntity?: () => void;
  onUploadPdf?: (files: File[]) => void;
  onExportCsv?: () => void;
  onOpenFilters?: () => void;
  onShowResults?: () => void;
};

const LibraryResultsFooter = ({
  onCreateEntity,
  onUploadPdf,
  onExportCsv,
  onOpenFilters,
  onShowResults,
}: LibraryResultsFooterProps) => {
  const isMobile = useIsMobile() === true;
  const menus = useLibraryResultsFooterMenus();

  if (!isMobile) {
    return (
      <div
        className="flex h-12 shrink-0 items-center gap-2 border-t border-border bg-paper px-3"
        data-testid="library-results-footer"
      >
        <div data-testid="library-results-actions" className="flex min-w-0 items-center gap-2">
          {renderActionItems({
            variant: 'bar',
            onCreateEntity,
            onExportCsv,
            pdfInputRef: menus.pdfInputRef,
          })}
          <NeedAuthorization roles={editorRoles}>
            {renderPdfFileInput({ inputRef: menus.pdfInputRef, onUploadPdf })}
          </NeedAuthorization>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex h-12 shrink-0 items-center justify-between gap-2 border-t border-border bg-paper px-3"
      data-testid="library-results-footer"
    >
      <NeedAuthorization roles={editorRoles}>
        {renderPdfFileInput({ inputRef: menus.pdfInputRef, onUploadPdf })}
      </NeedAuthorization>
      <div
        data-testid="library-results-actions"
        className="relative min-w-0"
        ref={menus.actionsRef}
      >
        <LibraryFooterButton
          icon={<EllipsisHorizontalIcon className={iconClassName} />}
          onClick={menus.toggleActions}
          expanded={menus.actionsOpen}
          popup="menu"
          controls={menus.actionsMenuId}
        >
          <Translate>Actions</Translate>
        </LibraryFooterButton>
        <LibraryFooterMenu
          open={menus.actionsOpen}
          onClose={menus.closeActions}
          anchorRef={menus.actionsRef}
          label={menus.actionsLabel}
          menuId={menus.actionsMenuId}
          prefer="start"
        >
          {renderActionItems({
            variant: 'menu',
            onCreateEntity,
            onExportCsv,
            pdfInputRef: menus.pdfInputRef,
            onItemChosen: menus.closeActions,
          })}
        </LibraryFooterMenu>
      </div>

      <button
        ref={menus.panesRef}
        type="button"
        aria-label={menus.panesLabel}
        aria-haspopup="menu"
        aria-expanded={menus.panesOpen}
        aria-controls={menus.panesMenuId}
        onClick={menus.togglePanes}
        className="inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-md border border-border bg-paper text-ink-secondary transition-colors hover:bg-parchment hover:text-ink"
      >
        <EllipsisHorizontalIcon className="h-4 w-4" aria-hidden />
      </button>
      <LibraryFooterMenu
        open={menus.panesOpen}
        onClose={menus.closePanes}
        anchorRef={menus.panesRef}
        label={menus.panesLabel}
        menuId={menus.panesMenuId}
        prefer="end"
      >
        <button
          type="button"
          role="menuitem"
          className={menuItemClassName}
          onClick={() => {
            menus.closePanes();
            onOpenFilters?.();
          }}
        >
          <Translate>Filters</Translate>
        </button>
        <button
          type="button"
          role="menuitem"
          className={menuItemClassName}
          onClick={() => {
            menus.closePanes();
            onShowResults?.();
          }}
        >
          <Translate>Results</Translate>
        </button>
      </LibraryFooterMenu>
    </div>
  );
};

export type { LibraryResultsFooterProps };
export { LibraryResultsFooter };
