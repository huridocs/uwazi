import React, { useState } from 'react';
import _ from 'lodash';
import { Translate } from 'app/I18N';
import { Icon } from 'app/UI';
import { ClientFile } from 'app/istore';
import { MediaModal, MediaModalProps, MediaModalType } from 'app/Metadata/components/MediaModal';
import MarkdownMedia from 'app/Markdown/components/MarkdownMedia';
import { constructFile } from 'app/Library/actions/saveEntityWithFiles';

type MediaFieldProps = MediaModalProps & {
  value: string | null;
  localAttachments: ClientFile[];
  formModel: string;
  name: string;
};

const MediaField = (props: MediaFieldProps) => {
  const {
    attachments = [],
    value,
    onChange,
    type,
    localAttachments = [],
    formModel,
    name: formField,
  } = props;
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
        formModel={formModel}
        formField={formField}
      />
    </div>
  );
};

export default MediaField;
