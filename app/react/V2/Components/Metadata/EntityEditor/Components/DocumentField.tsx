import React, { useEffect, useState } from 'react';
import { useAtomValue } from 'jotai';
import { Translate } from '#app/I18N/index.js';
import { settingsAtom } from '#V2/atoms/index.js';
import { InputField } from '#V2/Components/Forms/index.js';
import { getMainDocument } from '#V2/formatters/index.js';
import type { Entity } from '#V2/api/entities/types.js';
import type { FileType } from '#shared/types/fileType.js';
import type { DocumentFieldMutations } from '../editEntityTypes.js';
import { EntityField } from './EntityField.js';

type DocumentFieldProps = {
  entity?: Entity;
  disabled?: boolean;
  mutations: DocumentFieldMutations;
};

const typeLabelFromMime = (mainDocument: FileType) => {
  const type = (mainDocument.mimetype || '').split('/').pop() || '';
  return type.toUpperCase();
};

const DocumentField = ({ entity, disabled = false, mutations }: DocumentFieldProps) => {
  const settings = useAtomValue(settingsAtom);
  const defaultLanguage = settings?.languages?.find(language => language.default)?.key;
  const mainDocument = getMainDocument(entity?.documents, entity?.language || '', defaultLanguage);
  const [name, setName] = useState(mainDocument?.originalname ?? '');

  useEffect(() => {
    setName(mainDocument?.originalname ?? '');
  }, [mainDocument?._id, mainDocument?.originalname]);

  if (!mainDocument) {
    return null;
  }

  const renameOnBlur = () => {
    if (name.trim() && name !== mainDocument.originalname) {
      mutations.renameDocument(mainDocument, name.trim()).catch(() => undefined);
    }
  };

  return (
    <EntityField>
      <div className="text-sm font-bold text-ink">
        <Translate context="System">Document</Translate>
      </div>
      <div className="space-y-2 flex gap-2">
        <InputField
          id="document-name"
          className="flex-1"
          label="Name"
          labelVariant="secondary"
          value={name}
          disabled={disabled}
          onChange={event => setName(event.target.value)}
          onBlur={renameOnBlur}
        />
        <InputField
          id="document-type"
          label="Type"
          labelVariant="secondary"
          value={typeLabelFromMime(mainDocument)}
          disabled
        />
        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            if (mainDocument._id) {
              mutations.removeDocument(String(mainDocument._id)).catch(() => undefined);
            }
          }}
          className="shrink-0 cursor-pointer rounded-md px-3 py-1.5 text-xs font-medium text-seal transition-colors hover:bg-seal-tint disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Translate>Remove file</Translate>
        </button>
      </div>
    </EntityField>
  );
};

export { DocumentField };
