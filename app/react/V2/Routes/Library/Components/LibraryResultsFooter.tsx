import React, { useRef } from 'react';
import {
  PlusIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  TableCellsIcon,
} from '@heroicons/react/24/outline';
import { Translate } from '#app/I18N/index.js';
import { NeedAuthorization } from '#V2/Components/UI/NeedAuthorization.js';
import { LibraryFooterButton } from './LibraryFooterButton.js';
import { LibrarySingleSelectActions } from './LibrarySingleSelectActions.js';
import type { LibrarySingleSelectActionsProps } from './LibrarySingleSelectActions.js';

const iconClassName = 'h-3.5 w-3.5 shrink-0 text-ink-tertiary';
const editorRoles = ['admin', 'editor', 'collaborator'];

type LibraryResultsFooterProps = {
  onCreateEntity?: () => void;
  onUploadPdf?: (files: File[]) => void;
  onExportCsv?: () => void;
  singleSelection?: LibrarySingleSelectActionsProps;
};

const LibraryResultsFooter = ({
  onCreateEntity,
  onUploadPdf,
  onExportCsv,
  singleSelection,
}: LibraryResultsFooterProps) => {
  const pdfInputRef = useRef<HTMLInputElement>(null);

  return (
    <div
      className="flex h-12 shrink-0 items-center gap-2 border-t border-border bg-paper px-3"
      data-testid="library-results-footer"
    >
      <div data-testid="library-results-actions" className="flex min-w-0 items-center gap-2">
        <NeedAuthorization roles={editorRoles}>
          <LibraryFooterButton
            icon={<PlusIcon className={iconClassName} />}
            onClick={onCreateEntity}
          >
            <Translate>Create entity</Translate>
          </LibraryFooterButton>
          <LibraryFooterButton
            icon={<ArrowUpTrayIcon className={iconClassName} />}
            onClick={() => pdfInputRef.current?.click()}
          >
            <Translate>Upload PDF</Translate>
          </LibraryFooterButton>
          <input
            ref={pdfInputRef}
            type="file"
            accept="application/pdf,.pdf"
            multiple
            hidden
            onChange={event => {
              const files = Array.from(event.target.files ?? []);
              event.target.value = '';
              if (files.length) {
                onUploadPdf?.(files);
              }
            }}
          />
        </NeedAuthorization>
        <NeedAuthorization roles={['admin']}>
          <LibraryFooterButton
            icon={<TableCellsIcon className={iconClassName} />}
            to="/settings/csv"
          >
            <Translate>Import CSV</Translate>
          </LibraryFooterButton>
        </NeedAuthorization>
        <LibraryFooterButton
          icon={<ArrowDownTrayIcon className={iconClassName} />}
          onClick={onExportCsv}
        >
          <Translate>Export CSV</Translate>
        </LibraryFooterButton>
      </div>
      {singleSelection ? (
        <LibrarySingleSelectActions
          entityBasePath={singleSelection.entityBasePath}
          sharedId={singleSelection.sharedId}
          onAction={singleSelection.onAction}
          onClose={singleSelection.onClose}
        />
      ) : null}
    </div>
  );
};

export type { LibraryResultsFooterProps };
export { LibraryResultsFooter };
