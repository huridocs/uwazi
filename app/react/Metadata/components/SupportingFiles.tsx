import React from 'react';

import { ClientFile } from '#app/istore.js';
import { Translate } from '#app/I18N/index.js';
import { UploadSupportingFile } from '#app/Attachments/components/UploadSupportingFile.js';
import {
  uploadLocalAttachment,
  uploadLocalAttachmentFromUrl,
} from '../actions/supportingFilesActions.js';
import { MetadataFormFiles } from './MetadataFormFiles.js';

type SupportingFilesProps = {
  model: string;
  supportingFiles: ClientFile[];
  entitySharedID: string;
};

const SupportingFiles = ({ supportingFiles, entitySharedID, model }: SupportingFilesProps) => (
  <div className="attachments-list-parent">
    <div className="attachments-list-header editor">
      <h2>
        <Translate>Supporting files</Translate>
      </h2>

      <UploadSupportingFile
        entitySharedId={entitySharedID || 'NEW_ENTITY'}
        storeKey="library"
        uploadAttachment={uploadLocalAttachment}
        uploadAttachmentFromUrl={uploadLocalAttachmentFromUrl}
        model={model}
      />
    </div>

    <MetadataFormFiles model={model} type="attachment" files={supportingFiles} />
  </div>
);

export { SupportingFiles };
