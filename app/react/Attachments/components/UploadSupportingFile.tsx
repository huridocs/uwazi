/* eslint-disable react/prop-types */

import React, { useState } from 'react';
import { connect } from 'react-redux';

import { Translate } from 'app/I18N';
import { Icon } from 'UI';

import { uploadAttachment } from '../actions/actions';
import AttachmentsModal from './AttachmentsModal';

interface UploadSupportingFileProps {
  entityId: string;
  entitySharedId: string;
  storeKey: string;
  progress?: any;
}

const UploadSupportingFile: React.FC<UploadSupportingFileProps> = props => {
  const { entitySharedId, entityId, storeKey, progress } = props;
  const [modalOpen, setModalOpen] = useState(false);

  const openModal = () => setModalOpen(true);
  const closeModal = () => setModalOpen(false);

  // Get percentage number
  const getPercentage = progress.get(entitySharedId);

  return (
    <>
      {getPercentage === undefined ? (
        <button
          type="button"
          onClick={openModal}
          className="upload-button btn btn-success attachments-modal-trigger"
        >
          <Icon icon="plus" />
          <Translate>Add supporting file</Translate>
        </button>
      ) : (
        <div className="btn btn-default btn-disabled">
          <Translate>Uploading</Translate>
          <span>&nbsp;{getPercentage}%</span>
        </div>
      )}

      <AttachmentsModal
        isOpen={modalOpen}
        onClose={closeModal}
        entitySharedId={entitySharedId}
        entityId={entityId}
        storeKey={storeKey}
        getPercentage={getPercentage}
      />
    </>
  );
};

export function mapStateToProps({ attachments }: { attachments: any }) {
  return {
    progress: attachments.progress,
  };
}

export const mapDispatchToProps = {
  uploadAttachment,
};

export default connect(mapStateToProps, mapDispatchToProps)(UploadSupportingFile);
