import React from 'react';
import { PlusIcon, ArrowUpTrayIcon, TableCellsIcon } from '@heroicons/react/24/outline';
import { Translate } from '#app/I18N/index.js';
import { NeedAuthorization } from '#V2/Components/UI/NeedAuthorization.js';
import { LibraryFooterButton } from './LibraryFooterButton.js';

const iconClassName = 'h-3.5 w-3.5 shrink-0 text-ink-tertiary';

const LibraryResultsFooter = () => (
  <NeedAuthorization roles={['admin', 'editor', 'collaborator']}>
    <div className="flex h-12 shrink-0 items-center gap-2 border-t border-border bg-paper px-3">
      <LibraryFooterButton icon={<PlusIcon className={iconClassName} />}>
        <Translate>Create entity</Translate>
      </LibraryFooterButton>
      <LibraryFooterButton icon={<ArrowUpTrayIcon className={iconClassName} />}>
        <Translate>Upload PDF</Translate>
      </LibraryFooterButton>
      <NeedAuthorization roles={['admin']}>
        <LibraryFooterButton icon={<TableCellsIcon className={iconClassName} />} to="/settings/csv">
          <Translate>Import / Export CSV</Translate>
        </LibraryFooterButton>
      </NeedAuthorization>
    </div>
  </NeedAuthorization>
);

export { LibraryResultsFooter };
