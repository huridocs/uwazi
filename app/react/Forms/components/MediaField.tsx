import React, { useState } from 'react';

import { Translate } from 'app/I18N';
import { Icon } from 'app/UI';
import { MediaModalProps, MediaModalType } from 'app/Metadata/components/MediaModal';
import MarkdownMedia from 'app/Markdown/components/MarkdownMedia';
import { constructFile } from 'app/Library/actions/saveEntityWithFiles';
import _ from 'lodash';
import { ClientFile } from 'app/istore';
import { MediaModal } from 'app/Metadata/components/MediaModalContainer';

type MediaFieldProps = MediaModalProps & {
  value: string | null;
  localAttachments: ClientFile[];
};

const MediaField = (props: MediaFieldProps) => {
  const { attachments = [], value, onChange, type, localAttachments = [] } = props;
  const [openModal, setOpenModal] = useState(false);

  const handleCloseMediaModal = () => {
    setOpenModal(false);
  };

  const handleImageRemove = () => {
    onChange(null);
  };

  const imageUrl =
    _.isNumber(value) && localAttachments.length > value
      ? URL.createObjectURL(constructFile(localAttachments[value]))
      : value;

  return (
    <div className="search__filter--selected__media">
      {imageUrl &&
        (type === MediaModalType.Image ? (
          <img src={imageUrl} alt="" />
        ) : (
          <MarkdownMedia config={value} />
        ))}

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
