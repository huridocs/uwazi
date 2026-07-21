import React, { useEffect, useState } from 'react';
import isObject from 'lodash/isObject.js';
import { Translate } from '#app/I18N/index.js';
import { Icon } from '#app/UI/index.js';
import { ClientFile } from '#app/istore.js';
import { prepareHTMLMediaView, revokeHTMLMediaViewUrl } from '#shared/fileUploadUtils.js';
import {
  MediaModal,
  MediaModalProps,
  MediaModalType,
} from '#app/Metadata/components/MediaModal.js';
import { MarkdownMedia, TimeLink } from '#app/Markdown/components/MarkdownMedia.js';
import { ImageViewer } from '#app/Metadata/components/ImageViewer.js';

type MediaFieldProps = MediaModalProps & {
  value: string | { data: string; originalFile: Partial<File> } | null;
  localAttachments: ClientFile[];
  formModel: string;
  name: string;
  multipleEdition: boolean;
};

const getValue = (value: MediaFieldProps['value']) =>
  isObject(value) && value.data ? value.data : (value as string);

const parseMediaFieldData = (raw: string) => {
  const timelinkMatch = raw.match(/^\(([^,]+),\s*({.*})\)$/);
  if (timelinkMatch) {
    return { mediaId: timelinkMatch[1].trim(), timeLinksJson: timelinkMatch[2] };
  }
  return { mediaId: raw };
};

const prepareValue = (
  value: MediaFieldProps['value'],
  localAttachments: MediaFieldProps['localAttachments']
) => {
  const valueString = getValue(value);
  const { mediaId, timeLinksJson } = parseMediaFieldData(valueString || '');
  const values = {
    data: valueString,
    fileURL: valueString,
    type: '',
    originalFile: isObject(value) ? value.originalFile : undefined,
  };

  if (/^[a-zA-Z\d_]+$/.test(mediaId)) {
    values.type = 'uploadId';
  }

  if (/^https?:\/\//.test(mediaId)) {
    values.type = 'webUrl';
  }

  const supportingFile = localAttachments.find(
    file => mediaId === (file.url || file.fileLocalID || `/api/files/${file.filename}`)
  );

  if (values.type === 'uploadId' && supportingFile) {
    values.originalFile = supportingFile;
    const blobUrl = prepareHTMLMediaView(supportingFile);
    values.fileURL = timeLinksJson ? `(${blobUrl}, ${timeLinksJson})` : blobUrl;
  } else if (timeLinksJson && (values.type === 'webUrl' || mediaId.startsWith('/api/files/'))) {
    values.fileURL = `(${mediaId}, ${timeLinksJson})`;
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
  const constructTimelinksString = (timelinks: TimeLink[]) => {
    if (!file || !file.data) {
      return null;
    }
    const timelinksObj = timelinks.reduce<Record<string, string>>(
      (current, timelink) => ({
        ...current,
        [`${timelink.timeHours}:${timelink.timeMinutes}:${timelink.timeSeconds}`]: timelink.label,
      }),
      {}
    );
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
      if (file?.supportingFile?.serializedFile && file.fileURL) {
        const blobUrl = file.fileURL.startsWith('(')
          ? parseMediaFieldData(file.fileURL).mediaId
          : file.fileURL;
        if (blobUrl.startsWith('blob:')) {
          revokeHTMLMediaViewUrl(blobUrl);
        }
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
        if (
          (file &&
            file.data &&
            file.supportingFile &&
            file.supportingFile.mimetype?.search(/image\/*/) !== -1) ||
          type === MediaModalType.Image
        ) {
          return file?.fileURL ? <ImageViewer src={file.fileURL} alt="media" /> : null;
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
        return null;
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

export { MediaField };
