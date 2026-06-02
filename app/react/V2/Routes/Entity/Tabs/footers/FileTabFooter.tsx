import React from 'react';
import { ArrowDownTrayIcon, EyeIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Translate } from '#app/I18N/index.js';
import { Button, NeedAuthorization } from '#V2/Components/UI/index.js';
import { useEntityFiles } from '../../Components/Files/EntityFilesContext.js';
import { EntityTabFooter } from '../EntityTabFooter.js';

const FileTabFooter = () => {
  const { focusedRow, isEditing, requestDeleteRow } = useEntityFiles();

  if (!focusedRow || isEditing) {
    return <EntityTabFooter />;
  }

  const fileUrl =
    focusedRow.raw.url || (focusedRow.raw.filename ? `/api/files/${focusedRow.raw.filename}` : '');

  if (!fileUrl) {
    return <EntityTabFooter />;
  }

  return (
    <EntityTabFooter>
      <div className="flex w-full items-center gap-2">
        <a href={fileUrl} className="inline-flex">
          <Button variant="ghost" className="inline-flex items-center gap-1">
            <EyeIcon className="h-4 w-4" />
            <Translate>View</Translate>
          </Button>
        </a>
        <a
          href={focusedRow.raw.filename ? `${fileUrl}?download=true` : fileUrl}
          className="inline-flex"
        >
          <Button variant="ghost" className="inline-flex items-center gap-1">
            <ArrowDownTrayIcon className="h-4 w-4" />
            <Translate>Download</Translate>
          </Button>
        </a>
        <div className="ml-auto">
          <NeedAuthorization roles={['admin', 'editor']}>
            <Button
              variant="dangerSubtle"
              onClick={() => requestDeleteRow(focusedRow)}
              className="inline-flex items-center gap-1"
            >
              <TrashIcon className="h-4 w-4" />
              <Translate>Delete file</Translate>
            </Button>
          </NeedAuthorization>
        </div>
      </div>
    </EntityTabFooter>
  );
};

export { FileTabFooter };
