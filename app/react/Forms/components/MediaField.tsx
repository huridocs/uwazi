import React, { useEffect, useState } from 'react';
import { isObject } from 'lodash';
import { Translate } from 'app/I18N';
import { Icon } from 'app/UI';
import { ClientFile } from 'app/istore';
import { prepareHTMLMediaView } from 'shared/fileUploadUtils';
import { MediaModal, MediaModalProps, MediaModalType } from 'app/Metadata/components/MediaModal';
import MarkdownMedia from 'app/Markdown/components/MarkdownMedia';

type MediaFieldProps = MediaModalProps & {
  value: string | { data: string; originalFile: File } | null;
  localAttachments: ClientFile[];
  formModel: string;
  name: string;
  multipleEdition: boolean;
};

const prepareValue = (
  value: MediaFieldProps['value'],
  localAttachments: MediaFieldProps['localAttachments']
) => {
  const originalValue = isObject(value) && value.data ? value.data : (value as string);
  let fileURL = originalValue;
  let type: 'uploadId' | 'webUrl' | undefined;

  if (/^[a-zA-Z\d_]*$/.test(originalValue)) {
    type = 'uploadId';
  }

  if (/^https?:\/\//.test(originalValue)) {
    type = 'webUrl';
  }

  const supportingFile = localAttachments.find(
    file => originalValue === (file.url || file.fileLocalID || `/api/files/${file.filename}`)
  );

  if (type === 'uploadId' && supportingFile) {
    fileURL = prepareHTMLMediaView(supportingFile);
  }

  return { originalValue, type, supportingFile, fileURL };
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

  const file = prepareValue(value, localAttachments);

  useEffect(() => {
    if (file.originalValue && !file.supportingFile && file.type === 'uploadId') {
      handleImageRemove();
    }
  }, [localAttachments]);

  return (
    <div className="search__filter--selected__media">
      {file.fileURL &&
        (type === MediaModalType.Image ? (
          <img src={file.fileURL} alt="" />
        ) : (
          <MarkdownMedia config={file.fileURL} />
        ))}

      <div className="search__filter--selected__media-toolbar">
        <button type="button" onClick={() => setOpenModal(true)} className="btn btn-success">
          <Icon icon="plus" /> <Translate>Select supporting file</Translate>
        </button>

        {file.originalValue && (
          <button type="button" onClick={handleImageRemove} className="btn btn-danger ">
            <Icon icon="trash-alt" />
          </button>
        )}
      </div>

      <MediaModal
        isOpen={openModal}
        onClose={handleCloseMediaModal}
        onChange={onChange}
        selectedUrl={file.originalValue}
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
