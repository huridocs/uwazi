import React from 'react';
import { Translate } from '#app/I18N/index.js';
import { Button } from '#V2/Components/UI/index.js';
import { EntityWriteAuthorization } from '#V2/Routes/Entity/Components/context/index.js';
import { useEntityFiles } from '../../Components/Files/EntityFilesContext.js';
import { EntityTabFooter } from '../EntityTabFooter.js';

const FilesListSideFooter = () => {
  const { requestAddFile } = useEntityFiles();

  return (
    <EntityTabFooter inset="side">
      <div className="flex w-full items-center gap-2">
        <EntityWriteAuthorization>
          <Button
            variant="warm"
            onClick={() => requestAddFile('main')}
            className="inline-flex items-center gap-1.5"
          >
            <span className="text-ink-tertiary">+</span>
            <Translate>Add file</Translate>
          </Button>
        </EntityWriteAuthorization>
      </div>
    </EntityTabFooter>
  );
};

export { FilesListSideFooter };
