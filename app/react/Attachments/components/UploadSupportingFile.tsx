import React, { useEffect, useState } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators, Dispatch } from 'redux';
import { Translate } from 'app/I18N';
import { Icon } from 'UI';
import { attachmentCompleted } from 'app/Metadata/actions/supportingFilesActions';
import { uploadAttachment, uploadAttachmentFromUrl } from '../actions/actions';
import { AttachmentsModal } from './AttachmentsModal';

interface UploadSupportingFileProps {
  entitySharedId: string;
  storeKey: string;
  model?: string;
  progress?: any;
  uploadAttachment?: (...args: any[]) => (dispatch: Dispatch<{}>) => Promise<any>;
  uploadAttachmentFromUrl?: (...args: any[]) => (dispatch: Dispatch<{}>) => void;
  attachmentCompleted: (entity: string) => (dispatch: Dispatch<{}>) => void;
}

function mapStateToProps({ attachments }: { attachments: any }) {
  return {
    progress: attachments.progress,
  };
}

const mapDispatchToProps = (dispatch: Dispatch<{}>) =>
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

export { mapDispatchToProps, mapStateToProps };
export default connector(UploadSupportingFile);
