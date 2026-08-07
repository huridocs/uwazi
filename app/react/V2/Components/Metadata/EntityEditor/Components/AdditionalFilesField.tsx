import React from 'react';
import { Translate } from '#app/I18N/index.js';
import type { Entity } from '#V2/api/entities/types.js';
import type { DocumentFieldMutations } from '../editEntityTypes.js';
import { EntityField } from './EntityField.js';
import { EntityFileNameRow } from './EntityFileNameRow.js';
import { mimeCategoryLabel } from './fileMimeLabels.js';

type AdditionalFilesFieldProps = {
  entity?: Entity;
  disabled?: boolean;
  mutations: DocumentFieldMutations;
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
        {attachments.map((file, index) => {
          const fileId = file._id ? String(file._id) : '';
          return (
            <div
              key={fileId || `${file.filename || file.originalname}-${index}`}
              className="space-y-1"
            >
              <span className="text-sm font-normal text-ink-tertiary">
                <Translate context="System">{mimeCategoryLabel(file.mimetype)}</Translate>
              </span>
              <EntityFileNameRow
                id={`additional-file-name-${fileId || file.filename || file.originalname || 'file'}`}
                className="flex-1"
                originalname={file.originalname}
                disabled={disabled}
                hideLabel
                onRename={name => mutations.renameDocument(file, name)}
                onRemove={fileId ? () => mutations.removeDocument(fileId) : undefined}
              />
            </div>
          );
        })}
      </div>
    </EntityField>
  );
};

export { AdditionalFilesField };
