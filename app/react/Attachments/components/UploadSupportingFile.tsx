import React, { useEffect, useState } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { Translate } from '#app/I18N/index.js';
import { Icon } from '#UI/index.js';
import { attachmentCompleted } from '#app/Metadata/actions/supportingFilesActions.js';
import { uploadAttachment, uploadAttachmentFromUrl } from '../actions/actions.js';
import { AttachmentsModal } from './AttachmentsModal.js';
import { AppDispatch } from '#app/thunkDispatch.js';

interface UploadSupportingFileProps {
  entitySharedId: string;
  storeKey: string;
  model?: string;
  progress?: any;
  uploadAttachment?: (...args: any[]) => (dispatch: AppDispatch) => Promise<any>;
  uploadAttachmentFromUrl?: (...args: any[]) => (dispatch: AppDispatch) => void;
  attachmentCompleted: (entity: string) => (dispatch: AppDispatch) => void;
}

function mapStateToProps({ attachments }: { attachments: any }) {
  return {
    progress: attachments.progress,
  };
}

const mapDispatchToProps = (dispatch: AppDispatch) =>
  bindActionCreators({ attachmentCompleted }, dispatch);

const connector = connect(mapStateToProps, mapDispatchToProps);

const UploadSupportingFile = (props: UploadSupportingFileProps) => {
  const { entitySharedId, storeKey, progress, model = '' } = props;
  const [modalOpen, setModalOpen] = useState(false);

  const openModal = () => setModalOpen(true);
  const closeModal = () => {
    setModalOpen(false);
    props.attachmentCompleted(entitySharedId);
  };

  const getPercentage = progress.get(entitySharedId);

  useEffect(() => {
    if (getPercentage === 100) {
      closeModal();
    }
  }, [progress]);

  return (
    <>
      <button type="button" onClick={openModal} className="btn attachments-modal-trigger">
        <Icon icon="plus" />
        &nbsp;
        <Translate>Add file</Translate>
      </button>

      <AttachmentsModal
        isOpen={modalOpen}
        onClose={closeModal}
        entitySharedId={entitySharedId}
        storeKey={storeKey}
        getPercentage={getPercentage}
        model={model}
        uploadAttachment={props.uploadAttachment || uploadAttachment}
        uploadAttachmentFromUrl={props.uploadAttachmentFromUrl || uploadAttachmentFromUrl}
      />
    </>
  );
};

const UploadSupportingFileConnected = connector(UploadSupportingFile);
export {
  mapDispatchToProps,
  mapStateToProps,
  UploadSupportingFileConnected as UploadSupportingFile,
};
