import React from 'react';
import { PencilStrokeIcon } from '#V2/Components/CustomIcons/PencilStrokeIcon.js';
import { Translate } from '#app/I18N/index.js';
import { EntityWriteAuthorization } from '#V2/Routes/Entity/Components/context/index.js';
import { fileSupportsLanguage } from './fileHelpers.js';
import { getDetailsIcon } from './fileRowIcon.js';
import { FileDeleteAction } from './FileDeleteAction.js';
import { FileDetailsField } from './FileDetailsField.js';
import { FileDetailsCard } from './FileDetailsCard.js';
import { FileDocumentContextBadge } from './FileDocumentContextBadge.js';
import { EntityFileRow } from './types.js';

const FileDetailsView = ({ row, onEdit }: { row: EntityFileRow; onEdit: () => void }) => {
  const showLanguage = fileSupportsLanguage({
    type: row.raw.mimetype || '',
    name: row.raw.originalname || row.displayName,
  });

  return (
    <div className="space-y-3">
      <FileDetailsCard
        headerAction={
          <EntityWriteAuthorization>
            <button
              type="button"
              onClick={onEdit}
              className="flex cursor-pointer items-center gap-1 rounded px-2 py-0.5 text-meta font-medium leading-normal text-ink-secondary transition-colors hover:bg-paper hover:text-ink"
            >
              <PencilStrokeIcon className="h-micro w-micro text-ink-tertiary" />
              <Translate>Edit</Translate>
            </button>
          </EntityWriteAuthorization>
        }
      >
        <FileDetailsField label={<Translate>Name</Translate>}>
          <span className="flex min-w-0 items-center gap-2 text-sm font-normal leading-relaxed text-ink">
            {getDetailsIcon(row)}
            <span className="truncate">{row.displayName}</span>
          </span>
        </FileDetailsField>
        <FileDetailsField label={<Translate>Type</Translate>}>
          <span className="flex items-center gap-1.5 text-sm font-normal leading-relaxed text-ink">
            {getDetailsIcon(row)}
            <span>{row.typeLabel}</span>
          </span>
        </FileDetailsField>
        <FileDetailsField label={<Translate>Size</Translate>}>
          <span dir="ltr" className="text-sm font-normal leading-relaxed text-ink">
            {row.sizeLabel}
          </span>
        </FileDetailsField>
        {showLanguage ? (
          <FileDetailsField label={<Translate>Language</Translate>}>
            <span className="text-sm font-normal leading-relaxed text-ink">{row.languageKey}</span>
          </FileDetailsField>
        ) : null}
        <FileDetailsField label={<Translate>Modified</Translate>}>
          <span dir="ltr" className="text-sm font-normal leading-relaxed text-ink">
            {row.modifiedLabel}
          </span>
        </FileDetailsField>
      </FileDetailsCard>
      <FileDocumentContextBadge row={row} />
      <FileDeleteAction row={row} />
    </div>
  );
};

export { FileDetailsView };
