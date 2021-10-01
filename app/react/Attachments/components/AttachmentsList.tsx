import React from 'react';
import { ActionCreator, bindActionCreators, Dispatch } from 'redux';
import { connect, ConnectedProps } from 'react-redux';

import { advancedSort } from 'app/utils/advancedSort';
import { Translate } from 'app/I18N';
import { NeedAuthorization } from 'app/Auth';
import Attachment from 'app/Attachments/components/Attachment';

import { EntityWithFilesSchema } from 'shared/types/entityType';
import { FileType } from 'shared/types/fileType';

import {
  uploadAttachment,
  uploadAttachmentFromUrl,
  renameAttachment,
  deleteAttachment,
} from '../actions/actions';
import UploadSupportingFile from './UploadSupportingFile';

export interface AttachmentListProps {
  attachments: any;
  parentSharedId?: string;
  readOnly?: boolean;
  isTargetDoc?: boolean;
  storeKey?: string;
  entity?: EntityWithFilesSchema;
  uploadAttachmentAction?: ActionCreator<any>;
  uploadAttachmentFromUrlAction?: ActionCreator<any>;
  renameAttachmentAction?: ActionCreator<any>;
  deleteAttachmentAction?: ActionCreator<any>;
  confirm?: () => void;
}

const mapDispatchToProps = (dispatch: Dispatch<{}>, ownProps: AttachmentListProps) => {
  const {
    uploadAttachmentAction = uploadAttachment,
    uploadAttachmentFromUrlAction = uploadAttachmentFromUrl,
    renameAttachmentAction = renameAttachment,
    deleteAttachmentAction = deleteAttachment,
  } = ownProps;

  return bindActionCreators(
    {
      uploadAttachmentAction,
      uploadAttachmentFromUrlAction,
      renameAttachmentAction,
      deleteAttachmentAction,
    },
    dispatch
  );
};

const connector = connect(null, mapDispatchToProps);

type mappedProps = ConnectedProps<typeof connector>;
type ComponentProps = AttachmentListProps & mappedProps;

const arrangeFiles = (files = []) => advancedSort(files, { property: 'originalname' });

const AttachmentsList = ({
  parentSharedId = '',
  readOnly = false,
  isTargetDoc = false,
  storeKey = '',
  entity = {},
  attachments = [],
  ...props
}: ComponentProps) => {
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
            uploadAttachmentAction={props.uploadAttachmentAction}
            uploadAttachmentFromUrlAction={props.uploadAttachmentFromUrlAction}
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
            renameAttachmentAction={props.renameAttachmentAction}
            deleteAttachmentAction={props.deleteAttachmentAction}
          />
        ))}
      </div>
    </div>
  );
};

const container = connector(AttachmentsList);
export { container as AttachmentsList };
