import React from 'react';
import { bindActionCreators, Dispatch } from 'redux';
import { connect, ConnectedProps } from 'react-redux';
import { actions } from 'react-redux-form';

import { ClientFile } from 'app/istore';
import { Translate } from 'app/I18N';
import UploadSupportingFile from 'app/Attachments/components/UploadSupportingFile';
import {
  uploadLocalAttachment,
  uploadLocalAttachmentFromUrl,
} from '../actions/supportingFilesActions';
import { MetadataFormFiles } from './MetadataFormFiles';

type SupportingFilesProps = {
  model: string;
  supportingFiles: ClientFile[];
  entitySharedID: string;
};

const mapDispatchToProps = (dispatch: Dispatch<{}>, ownProps: SupportingFilesProps) => {
  const { model } = ownProps;
  return bindActionCreators(
    {
      removeSupportingFile: (index: number) => actions.remove(`${model}.attachments`, index),
    },
    dispatch
  );
};

const connector = connect(null, mapDispatchToProps);

type mappedProps = ConnectedProps<typeof connector>;
type ComponentProps = SupportingFilesProps & mappedProps;

const SupportingFiles = ({
  supportingFiles,
  entitySharedID,
  model,
  removeSupportingFile,
}: ComponentProps) => (
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

    <MetadataFormFiles
      type="attachment"
      files={supportingFiles}
      removeFile={removeSupportingFile}
    />
  </div>
);

const container = connector(SupportingFiles);
export { container as SupportingFiles };
