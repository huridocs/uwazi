import React from 'react';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { t } from '#app/I18N/index.js';
import {
  canDownloadRow,
  fileDownloadUrl,
  triggerDownload,
} from '../../Tabs/footers/FileDownloadButton.js';
import type { EntityFileRow } from './types.js';

const FileRowDownloadButton = ({ row }: { row: EntityFileRow }) => {
  const url = fileDownloadUrl(row);
  if (!canDownloadRow(row) || !url) return null;
  return (
    <button
      type="button"
      aria-label={`${t('System', 'Download', null, false)} ${row.displayName}`}
      className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-ink-tertiary transition-colors hover:bg-warm hover:text-ink"
      onClick={event => {
        event.stopPropagation();
        triggerDownload(url);
      }}
    >
      <ArrowDownTrayIcon className="h-3 w-3" />
    </button>
  );
};

export { FileRowDownloadButton };
