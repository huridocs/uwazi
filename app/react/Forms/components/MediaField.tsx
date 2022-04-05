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

const getValue = (value: MediaFieldProps['value']) =>
  isObject(value) && value.data ? value.data : (value as string);

const prepareValue = (
  value: MediaFieldProps['value'],
  localAttachments: MediaFieldProps['localAttachments']
) => {
  const valueString = getValue(value);
  const values = {
    originalValue: valueString,
    fileURL: valueString,
    type: '',
  };

  if (/^[a-zA-Z\d_]*$/.test(values.originalValue)) {
    values.type = 'uploadId';
  }

  if (/^https?:\/\//.test(values.originalValue)) {
    values.type = 'webUrl';
  }

  const supportingFile = localAttachments.find(
    file => values.originalValue === (file.url || file.fileLocalID || `/api/files/${file.filename}`)
  );

  if (values.type === 'uploadId' && supportingFile) {
    values.fileURL = prepareHTMLMediaView(supportingFile);
  }

  return { ...values, supportingFile };
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

  useEffect(
    () => () => {
      if (file.supportingFile?.serializedFile && file.fileURL) {
        URL.revokeObjectURL(file.fileURL);
      }
    },
    []
  );

  return (
    <div className="search__filter--selected__media">
      {file.fileURL &&
        (type === MediaModalType.Image ? (
          <img src={file.fileURL} alt="" />
        ) : (
          <MarkdownMedia config={file.fileURL} />
        ))}

      <div className="search__filter--selected__media-toolbar">
        <button type="button" onClick={() => setOpenModal(true)} className="btn">
          <Icon icon="plus" /> <Translate>{value ? 'Update' : 'Add file'}</Translate>
        </button>

        {file.originalValue && (
          <button type="button" onClick={handleImageRemove} className="btn">
            <Icon icon="unlink" />
            &nbsp; <Translate>Unlink</Translate>
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
