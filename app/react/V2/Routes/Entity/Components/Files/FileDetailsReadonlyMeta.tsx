import React from 'react';
import { Translate } from '#app/I18N/index.js';
import { getDetailsIcon } from './fileRowIcon.js';
import { FileDetailsField } from './FileDetailsField.js';
import { EntityFileRow } from './types.js';

const factClass = 'text-sm font-normal leading-relaxed text-ink';

const FileDetailsReadonlyMeta = ({ row }: { row: EntityFileRow }) => (
  <>
    <FileDetailsField label={<Translate>Type</Translate>}>
      <span className={`flex items-center gap-1.5 ${factClass}`}>
        {getDetailsIcon(row)}
        <span>{row.typeLabel}</span>
      </span>
    </FileDetailsField>
    <FileDetailsField label={<Translate>Size</Translate>}>
      <span dir="ltr" className={factClass}>
        {row.sizeLabel}
      </span>
    </FileDetailsField>
  </>
);

export { FileDetailsReadonlyMeta };
