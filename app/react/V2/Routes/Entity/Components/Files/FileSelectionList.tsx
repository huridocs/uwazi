import React from 'react';
import { Translate } from '#app/I18N/index.js';
import { fileFactsLine, fileShownName } from './fileHelpers.js';
import { getRowIcon } from './fileRowIcon.js';
import type { EntityFileRow } from './types.js';

const FileSelectionList = ({ rows }: { rows: EntityFileRow[] }) => (
  <div className="space-y-2">
    <p className="mb-2 text-xs font-medium text-ink-tertiary">
      {rows.length} <Translate>files</Translate> <Translate>selected</Translate>
    </p>
    {rows.map(row => (
      <div
        key={row.rowId}
        className="flex items-center gap-3 rounded-md border border-border-40 bg-warm px-3 py-2.5"
      >
        {getRowIcon(row)}
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium text-ink" title={row.displayName}>
            {fileShownName(row)}
          </p>
          <p className="mt-0.5 truncate text-meta text-ink-tertiary">{fileFactsLine(row)}</p>
        </div>
      </div>
    ))}
  </div>
);

export { FileSelectionList };
