import React, { useMemo, useState } from 'react';
import { ObjectId } from 'mongodb';

import { AttachmentSchema } from 'shared/types/commonTypes';
import { RenderAttachment } from 'app/Attachments/components/RenderAttachment';
import { Translate } from 'app/I18N';
import { Icon } from 'app/UI';
import { MediaModal, MediaModalType } from 'app/Metadata/components/MediaModal';

interface MediaFieldProps {
  attachments: AttachmentSchema[];
  value: string | ObjectId | null;
  type?: MediaModalType;
  onChange: (val: string | ObjectId | null) => void;
}

const MediaField = ({ attachments, value, onChange, type }: MediaFieldProps) => {
  const [openModal, setOpenModal] = useState(false);

  const selectedImage = useMemo(() => attachments.find(a => a._id === value), [attachments, value]);

  const handleCloseMediaModal = () => {
    setOpenModal(false);
  };

  const handleImageRemove = () => {
    onChange(null);
  };

  return (
    <div className="search__filter--selected__media">
      {!!selectedImage && <RenderAttachment attachment={selectedImage} />}

      <div className="search__filter--selected__media-toolbar">
        <button type="button" onClick={() => setOpenModal(true)} className="btn btn-success">
          <Icon icon="plus" /> <Translate>Select supporting file</Translate>
        </button>

        {!!selectedImage && (
          <button type="button" onClick={handleImageRemove} className="btn btn-danger ">
            <Icon icon="trash-alt" />
          </button>
        )}
      </div>

      <MediaModal
        isOpen={openModal}
        onClose={handleCloseMediaModal}
        onChange={onChange}
        selectedId={value}
        attachments={attachments}
        type={type}
      />
    </div>
  );
};

export default MediaField;
