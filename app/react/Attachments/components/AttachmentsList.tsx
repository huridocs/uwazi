import React from 'react';
import { bindActionCreators, Dispatch } from 'redux';
import { connect } from 'react-redux';

import { advancedSort } from 'app/utils/advancedSort';
import { Translate } from 'app/I18N';
import { NeedAuthorization } from 'app/Auth';
import Attachment from 'app/Attachments/components/Attachment';

import { EntityWithFilesSchema } from 'shared/types/entityType';
import { FileType } from 'shared/types/fileType';

import { uploadAttachment, uploadAttachmentFromUrl } from '../actions/actions';
import UploadSupportingFile from './UploadSupportingFile';

export type uploadActionsType = {
  uploadAttachmentAction: (
    entity?: any,
    file?: any,
    __reducerKey?: any,
    options?: {}
  ) => Dispatch<{}>;
  uploadAttachmentFromUrlAction: (
    entity?: any,
    name?: any,
    url?: any,
    __reducerKey?: any
  ) => Dispatch<{}>;
};

export interface AttachmentListProps {
  attachments: FileType[];
  parentSharedId: string;
  readOnly: boolean;
  isTargetDoc: boolean;
  storeKey: string;
  uploadActions: uploadActionsType;
  entity: EntityWithFilesSchema;
  confirm: () => void;
}

const arrangeFiles = (files = []) => advancedSort(files, { property: 'originalname' });

const AttachmentsList = ({
  parentSharedId = '',
  readOnly = false,
  isTargetDoc = false,
  storeKey = '',
  entity,
  attachments = [],
  uploadActions = {
    uploadAttachmentAction: uploadAttachment,
    uploadAttachmentFromUrlAction: uploadAttachmentFromUrl,
  },
}: AttachmentListProps) => {
  const label = (
    <h2>
      <Translate>Supporting files</Translate>
    </h2>
  );

  const forcedReadOnly = readOnly || Boolean(isTargetDoc);

  let uploadAttachmentButton = null;

  if (!isTargetDoc) {
    uploadAttachmentButton = (
      <NeedAuthorization roles={['admin', 'editor']} orWriteAccessTo={[entity]}>
        <div className="attachment-add">
          <UploadSupportingFile
            entitySharedId={parentSharedId}
            storeKey={storeKey}
            uploadActions={uploadActions}
          />
        </div>
      </NeedAuthorization>
    );
  }

  const arrangedAttachments = arrangeFiles(attachments);
  return (
    <div className="attachments-list-parent">
      <div className="attachments-list-header">
        {arrangedAttachments.length === 0 ? (
          <NeedAuthorization roles={['admin', 'editor']} orWriteAccessTo={[entity]}>
            {label}
          </NeedAuthorization>
        ) : (
          <>{label}</>
        )}
        {uploadAttachmentButton}
      </div>
      <div className="attachments-list">
        {arrangedAttachments.map((file: FileType, index: any) => (
          <Attachment
            key={index}
            file={file}
            readOnly={forcedReadOnly}
            storeKey={storeKey}
            parentSharedId={parentSharedId}
            entity={entity}
          />
        ))}
      </div>
    </div>
  );
};

const mapDispatchToProps = (dispatch: Dispatch<{}>, ownProps: AttachmentListProps) => {
  const uploadAttachmentAction = ownProps.uploadActions?.uploadAttachmentAction || uploadAttachment;
  const uploadAttachmentFromUrlAction =
    ownProps.uploadActions?.uploadAttachmentFromUrlAction || uploadAttachmentFromUrl;

  return bindActionCreators(
    {
      uploadAttachmentAction,
      uploadAttachmentFromUrlAction,
    },
    dispatch
  );
};

const connector = connect(null, mapDispatchToProps);

const container = connector(AttachmentsList);
export { container as AttachmentsList };
