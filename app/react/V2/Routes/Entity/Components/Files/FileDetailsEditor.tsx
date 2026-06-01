import React, { useMemo, useState } from 'react';
import { CheckIcon } from '@heroicons/react/24/outline';
import { Translate } from '#app/I18N/index.js';
import { InputField } from '#V2/Components/Forms/InputField.js';
import { Select } from '#V2/Components/Forms/Select.js';
import { Button } from '#V2/Components/UI/index.js';
import { settingsAtom } from '#V2/atoms/index.js';
import { useAtomValue } from 'jotai';
import { EntityFileRow } from './types.js';

const FileDetailsEditor = ({
  row,
  onSave,
  onCancel,
}: {
  row: EntityFileRow;
  onSave: (payload: { _id: string; originalname: string; language?: string }) => Promise<void>;
  onCancel: () => void;
}) => {
  const settings = useAtomValue(settingsAtom);
  const [originalname, setOriginalname] = useState(row.raw.originalname || row.displayName);
  const [language, setLanguage] = useState(row.raw.language || '');

  const languages = useMemo(
    () => settings?.languages?.map(item => item.key).filter(Boolean) || [],
    [settings?.languages]
  );

  return (
    <div className="rounded-md border border-border-soft bg-warm p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-tertiary">
          <Translate>File details</Translate>
        </h3>
        <Button
          variant="primary"
          size="small"
          onClick={() =>
            row.raw._id
              ? onSave({
                  _id: row.raw._id,
                  originalname,
                  language: language || undefined,
                })
              : Promise.resolve()
          }
          className="inline-flex items-center gap-1"
        >
          <CheckIcon className="h-4 w-4" />
          <Translate>Done</Translate>
        </Button>
      </div>
      <div className="space-y-3">
        <InputField
          id={`file-name-${row.raw._id}`}
          label="NAME"
          hideLabel={false}
          value={originalname}
          onChange={event => setOriginalname(event.target.value)}
        />
        <Select
          id={`file-language-${row.raw._id}`}
          label="LANGUAGE"
          value={language}
          onChange={event => setLanguage(event.target.value)}
          options={[
            { value: '', label: '—' },
            ...languages.map(key => ({ value: key, label: key.toUpperCase() })),
          ]}
        />
      </div>
      <div className="mt-3">
        <Button variant="ghost" onClick={onCancel}>
          <Translate>Cancel</Translate>
        </Button>
      </div>
    </div>
  );
};

export { FileDetailsEditor };
