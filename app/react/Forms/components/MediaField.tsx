import React, { useState } from 'react';

import { AttachmentSchema } from 'shared/types/commonTypes';
import { Translate } from 'app/I18N';
import { Icon } from 'app/UI';
import { MediaModal, MediaModalType } from 'app/Metadata/components/MediaModal';
import MarkdownMedia from 'app/Markdown/components/MarkdownMedia';

interface MediaFieldProps {
  attachments: AttachmentSchema[];
  value: string | null;
  type?: MediaModalType;
  onChange: (val: string | null) => void;
}

const MediaField = ({ attachments = [], value, onChange, type }: MediaFieldProps) => {
  const [openModal, setOpenModal] = useState(false);

  const handleCloseMediaModal = () => {
    setOpenModal(false);
  };

  const handleImageRemove = () => {
    onChange(null);
  };

  return (
    <div className="search__filter--selected__media">
      {value &&
        (type === MediaModalType.Image ? <img src={value} /> : <MarkdownMedia config={value} />)}

      <div className="search__filter--selected__media-toolbar">
        <button type="button" onClick={() => setOpenModal(true)} className="btn btn-success">
          <Icon icon="plus" /> <Translate>Select supporting file</Translate>
        </button>

        {value && (
          <button type="button" onClick={handleImageRemove} className="btn btn-danger ">
            <Icon icon="trash-alt" />
          </button>
        )}
      </div>

      <MediaModal
        isOpen={openModal}
        onClose={handleCloseMediaModal}
        onChange={onChange}
        selectedUrl={value}
        attachments={attachments}
        type={type}
      />
    </div>
  );
};

export default MediaField;
