import React, { useEffect, useState } from 'react';
import { isObject } from 'lodash';
import { Translate } from 'app/I18N';
import { Icon } from 'app/UI';
import { ClientFile } from 'app/istore';
import { prepareHTMLMediaView } from 'shared/fileUploadUtils';
import { MediaModal, MediaModalProps, MediaModalType } from 'app/Metadata/components/MediaModal';
import MarkdownMedia, { TimeLink } from 'app/Markdown/components/MarkdownMedia';

type MediaFieldProps = MediaModalProps & {
  value: string | { data: string; originalFile: Partial<File> } | null;
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
    data: valueString,
    fileURL: valueString,
    type: '',
    originalFile: isObject(value) ? value.originalFile : undefined,
  };

  if (/^[a-zA-Z\d_]*$/.test(values.data)) {
    values.type = 'uploadId';
  }

  if (/^https?:\/\//.test(values.data)) {
    values.type = 'webUrl';
  }

  const supportingFile = localAttachments.find(
    file => values.data === (file.url || file.fileLocalID || `/api/files/${file.filename}`)
  );

  if (values.type === 'uploadId' && supportingFile) {
    values.originalFile = supportingFile;
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
  const [imageRenderError, setImageRenderError] = useState(false);

  useEffect(() => {
    setImageRenderError(false);
  }, [localAttachments]);

  const handleCloseMediaModal = () => {
    setOpenModal(false);
  };

  const handleImageRemove = () => {
    onChange(null);
  };

  const file = prepareValue(value, localAttachments);
  const constructTimelinksString = (timelinks: TimeLink[]) => {
    if (!file || !file.data) {
      return null;
    }
    const timelinksObj = timelinks.reduce((current: any, timelink) => {
      current[`${timelink.timeHours}:${timelink.timeMinutes}:${timelink.timeSeconds}`] =
        timelink.label;
      return current;
    }, {});
    const [, fileLocalID] = file.data.match(/\(?(.*?)(, {|$)/) || ['', file.data];

    return {
      data: `(${fileLocalID}, ${JSON.stringify({ timelinks: timelinksObj })})`,
      originalFile: file.originalFile,
    };
  };

  const updateTimeLinks = (timelinks: TimeLink[]) => {
    onChange(constructTimelinksString(timelinks));
  };

  useEffect(
    () => () => {
      if (file && file.supportingFile?.serializedFile && file.fileURL) {
        URL.revokeObjectURL(file.fileURL);
      }
    },
    []
  );

  return (
    <div className="search__filter--selected__media">
      <div className="search__filter--selected__media-toolbar">
        <button type="button" onClick={() => setOpenModal(true)} className="btn">
          <Icon icon="plus" /> <Translate>{value ? 'Update' : 'Add file'}</Translate>
        </button>

        {file && file.data && (
          <button type="button" onClick={handleImageRemove} className="btn">
            <Icon icon="unlink" />
            &nbsp; <Translate>Unlink</Translate>
          </button>
        )}
      </div>

      {(() => {
        if (imageRenderError) {
          return (
            <div className="media-error">
              <Translate>This file type is not supported on media fields</Translate>
            </div>
          );
        }
        if (
          (file &&
            file.data &&
            file.supportingFile &&
            file.supportingFile.mimetype?.search(/image\/*/) !== -1) ||
          type === MediaModalType.Image
        ) {
          return file?.fileURL ? (
            <img
              src={file?.fileURL}
              alt=""
              onError={() => {
                if (file?.fileURL) {
                  setImageRenderError(true);
                }
              }}
            />
          ) : (
            // eslint-disable-next-line react/jsx-no-useless-fragment
            <></>
          );
        }
        if (file?.fileURL) {
          return (
            <MarkdownMedia
              config={file?.fileURL}
              editing
              onTimeLinkAdded={updateTimeLinks}
              type={file?.type}
            />
          );
        }
      })()}

      <MediaModal
        isOpen={openModal}
        onClose={handleCloseMediaModal}
        onChange={onChange}
        selectedUrl={file?.data}
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
