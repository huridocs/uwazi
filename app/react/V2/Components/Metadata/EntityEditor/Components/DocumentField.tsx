import React from 'react';
import { useAtomValue } from 'jotai';
import { Translate } from '#app/I18N/index.js';
import { settingsAtom } from '#V2/atoms/index.js';
import { readyDocuments } from '#shared/entityDefaultDocument.js';
import { getMainDocument } from '#V2/formatters/index.js';
import { InputField } from '#V2/Components/Forms/index.js';
import type { Entity } from '#V2/api/entities/types.js';
import type { DocumentFieldMutations } from '../editEntityTypes.js';
import { EntityField } from './EntityField.js';
import { EntityFileNameRow } from './EntityFileNameRow.js';
import { mimeSubtypeLabel } from './fileMimeLabels.js';

type DocumentFieldProps = {
  entity?: Entity;
  disabled?: boolean;
  mutations: DocumentFieldMutations;
};

const DocumentField = ({ entity, disabled = false, mutations }: DocumentFieldProps) => {
  const settings = useAtomValue(settingsAtom);
  const defaultLanguage = settings?.languages?.find(language => language.default)?.key;
  const mainDocument = getMainDocument(
    readyDocuments(entity?.documents),
    entity?.language || '',
    defaultLanguage
  );

  if (!mainDocument) {
    return null;
  }

  const fileId = mainDocument._id ? String(mainDocument._id) : '';

  return (
    <EntityField>
      <div className="text-sm font-bold text-ink">
        <Translate context="System">Document</Translate>
      </div>
      <EntityFileNameRow
        id="document-name"
        className="flex-1"
        originalname={mainDocument.originalname}
        disabled={disabled}
        onRename={async name => mutations.renameDocument(mainDocument, name)}
        onRemove={fileId ? async () => mutations.removeDocument(fileId) : undefined}
        trailing={
          <InputField
            id="document-type"
            label="Type"
            labelVariant="secondary"
            value={mimeSubtypeLabel(mainDocument.mimetype, mainDocument.filename)}
            disabled
          />
        }
      />
    </EntityField>
  );
};

export { DocumentField };
