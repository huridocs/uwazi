/* eslint-disable react/no-multi-comp */
import React, { useEffect, useState } from 'react';
import { Translate } from '#app/I18N/index.js';
import { InputField } from '#V2/Components/Forms/index.js';
import type { Entity } from '#V2/api/entities/types.js';
import type { FileType } from '#shared/types/fileType.js';
import type { DocumentFieldMutations } from '../editEntityTypes.js';
import { EntityField } from './EntityField.js';

type AdditionalFilesFieldProps = {
  entity?: Entity;
  disabled?: boolean;
  mutations: DocumentFieldMutations;
};

const categoryFromMime = (mimetype?: string) => {
  if (mimetype?.startsWith('video/')) return 'Video';
  if (mimetype?.startsWith('audio/')) return 'Audio';
  if (mimetype?.startsWith('image/')) return 'Image';
  return 'Document';
};

const AdditionalFileRow = ({
  file,
  disabled,
  mutations,
}: {
  file: FileType;
  disabled: boolean;
  mutations: DocumentFieldMutations;
}) => {
  const [name, setName] = useState(file.originalname ?? '');
  const fileId = file._id ? String(file._id) : '';

  useEffect(() => {
    setName(file.originalname ?? '');
  }, [file._id, file.originalname]);

  const renameOnBlur = () => {
    if (name.trim() && name !== file.originalname) {
      mutations.renameDocument(file, name.trim()).catch(() => undefined);
    }
  };

  return (
    <div className="space-y-1">
      <span className="text-sm font-normal text-ink-tertiary">
        <Translate context="System">{categoryFromMime(file.mimetype)}</Translate>
      </span>
      <div className="flex gap-2">
        <InputField
          id={`additional-file-name-${fileId || file.filename || name}`}
          className="flex-1"
          hideLabel
          value={name}
          disabled={disabled}
          onChange={event => setName(event.target.value)}
          onBlur={renameOnBlur}
        />
        {fileId ? (
          <button
            type="button"
            disabled={disabled}
            onClick={() => {
              mutations.removeDocument(fileId).catch(() => undefined);
            }}
            className="shrink-0 cursor-pointer rounded-md px-3 py-1.5 text-xs font-medium text-seal transition-colors hover:bg-seal-tint disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Translate>Remove file</Translate>
          </button>
        ) : null}
      </div>
    </div>
  );
};

const AdditionalFilesField = ({
  entity,
  disabled = false,
  mutations,
}: AdditionalFilesFieldProps) => {
  const attachments = entity?.attachments?.filter(file => file._id || file.originalname) ?? [];

  if (!attachments.length) {
    return null;
  }

  return (
    <EntityField>
      <div className="text-sm font-bold text-ink">
        <Translate context="System">Other files</Translate>
      </div>
      <div className="flex flex-col gap-3">
        {attachments.map((file, index) => (
          <AdditionalFileRow
            key={file._id ? String(file._id) : `${file.filename || file.originalname}-${index}`}
            file={file}
            disabled={disabled}
            mutations={mutations}
          />
        ))}
      </div>
    </EntityField>
  );
};

export { AdditionalFilesField };
