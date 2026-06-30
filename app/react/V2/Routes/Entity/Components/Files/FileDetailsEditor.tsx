import React, { useEffect, useMemo, useState } from 'react';
import { CheckIcon } from '@heroicons/react/24/outline';
import { Translate } from '#app/I18N/index.js';
import { LanguageUtils } from '#shared/language/index.js';
import { InputField, Select } from '#V2/Components/Forms/index.js';
import { Button } from '#V2/Components/UI/index.js';
import { fileLanguageSelectOptions } from './fileLanguageOptions.js';
import { fileSupportsLanguage } from './fileUploadHelpers.js';
import { EntityFileRow } from './types.js';

const resolveFileLanguage = (rawLanguage?: string) => {
  if (!rawLanguage) {
    return 'other';
  }

  if (rawLanguage === 'other') {
    return 'other';
  }

  const known = LanguageUtils.fromISO639_3(rawLanguage, false);
  return known?.ISO639_3 ?? 'other';
};

const readOnlyFieldClass = 'text-xs font-semibold uppercase tracking-wide text-ink-tertiary';

const FileDetailsEditor = ({
  row,
  onSave,
}: {
  row: EntityFileRow;
  onSave: (payload: { _id: string; originalname: string; language?: string }) => Promise<void>;
}) => {
  const [originalname, setOriginalname] = useState(row.raw.originalname || row.displayName);
  const resolvedLanguage = useMemo(() => resolveFileLanguage(row.raw.language), [row.raw.language]);
  const [language, setLanguage] = useState(resolvedLanguage);

  const languageOptions = useMemo(() => fileLanguageSelectOptions(), []);
  const showLanguage = fileSupportsLanguage({
    type: row.raw.mimetype || '',
    name: row.raw.originalname || row.displayName,
  });

  useEffect(() => {
    setLanguage(resolvedLanguage);
  }, [resolvedLanguage]);

  return (
    <div className="rounded-md border border-border-soft bg-warm p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className={readOnlyFieldClass}>
          <Translate>File details</Translate>
        </p>
        <Button
          variant="primary"
          size="small"
          onClick={async () =>
            row.raw._id
              ? onSave({
                  _id: row.raw._id,
                  originalname,
                  language: showLanguage ? language || undefined : undefined,
                })
              : Promise.resolve()
          }
          className="inline-flex items-center gap-1"
        >
          <CheckIcon className="h-4 w-4" />
          <Translate>Done</Translate>
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <InputField
            id={`file-name-${row.raw._id}`}
            label={<Translate>Name</Translate>}
            value={originalname}
            onChange={event => setOriginalname(event.target.value)}
          />
        </div>
        {showLanguage ? (
          <Select
            id={`file-language-${row.raw._id}`}
            label={<Translate>Language</Translate>}
            options={languageOptions}
            value={language}
            onChange={event => setLanguage(event.target.value)}
          />
        ) : null}
        <div>
          <div className={readOnlyFieldClass}>
            <Translate>Type</Translate>
          </div>
          <div className="text-sm text-ink">{row.typeLabel}</div>
        </div>
        <div>
          <div className={readOnlyFieldClass}>
            <Translate>Size</Translate>
          </div>
          <div className="text-sm text-ink">{row.sizeLabel}</div>
        </div>
        <div>
          <div className={readOnlyFieldClass}>
            <Translate>Modified</Translate>
          </div>
          <div className="text-sm text-ink">{row.modifiedLabel}</div>
        </div>
      </div>
    </div>
  );
};

export { FileDetailsEditor };
