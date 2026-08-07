import React from 'react';
import { TrashIcon } from '@heroicons/react/24/outline';
import { Translate } from '#app/I18N/index.js';
import { EntityWriteAuthorization } from '#V2/Routes/Entity/Components/context/index.js';
import { useEntityFiles } from './EntityFilesContext.js';
import { isFileRowSelectable } from './fileHelpers.js';
import { EntityFileRow } from './types.js';

const FileDeleteAction = ({ row }: { row: EntityFileRow }) => {
  const { requestDeleteRow } = useEntityFiles();

  if (!isFileRowSelectable(row)) {
    return null;
  }

  return (
    <EntityWriteAuthorization>
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => requestDeleteRow(row)}
          className="flex cursor-pointer items-center gap-1.5 rounded px-2.5 py-1 text-micro font-medium text-seal transition-colors hover:bg-seal-tint disabled:cursor-not-allowed disabled:opacity-60"
        >
          <TrashIcon className="h-3 w-3" />
          <Translate>Delete file</Translate>
        </button>
      </div>
    </EntityWriteAuthorization>
  );
};

export { FileDeleteAction };
