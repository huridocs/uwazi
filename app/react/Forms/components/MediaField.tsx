import React, { useEffect, useState } from 'react';
import { Translate } from 'app/I18N';
import { Icon } from 'app/UI';
import { ClientFile } from 'app/istore';
import { prepareHTMLMediaView } from 'shared/fileUploadUtils';
import { MediaModal, MediaModalProps, MediaModalType } from 'app/Metadata/components/MediaModal';
import MarkdownMedia from 'app/Markdown/components/MarkdownMedia';

type MediaFieldProps = MediaModalProps & {
  value: string | { url: string; originalFile: File } | null;
  localAttachments: ClientFile[];
  formModel: string;
  name: string;
  multipleEdition: boolean;
};

const MediaField = (props: MediaFieldProps) => {
  const {
    value,
    onChange,
    type,
    localAttachments = [],
    formModel,
    name: formField,
    multipleEdition,
  } = props;
  const [openModal, setOpenModal] = useState(false);

  const handleCloseMediaModal = () => {
    setOpenModal(false);
  };

  const handleImageRemove = () => {
    onChange(null);
  };

  let fileURL = value;
  const isUploadId = value && /^[a-zA-Z\d_]*$/.test(value);
  const isWebURL = value && /^https?:\/\//.test(value);
  const supportingFile = localAttachments.find(
    file => value === (file.url || file.fileLocalID || `/api/files/${file.filename}`)
  );

  if (isUploadId && supportingFile) {
    fileURL = prepareHTMLMediaView(supportingFile);
  }

  useEffect(() => {
    if (value && !supportingFile && !isWebURL) {
      handleImageRemove();
    }
  }, [localAttachments]);

  return (
    <div className="search__filter--selected__media">
      {fileURL &&
        (type === MediaModalType.Image ? (
          <img src={fileURL} alt="" />
        ) : (
          <MarkdownMedia config={fileURL} />
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
        attachments={localAttachments}
        type={type}
        formModel={formModel}
        formField={formField}
        multipleEdition={multipleEdition}
      />
    </div>
  );
};

export default MediaField;
