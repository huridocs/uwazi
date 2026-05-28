import React, { useMemo, useState } from 'react';
import { CheckIcon } from '@heroicons/react/24/outline';
import { Translate } from '#app/I18N/index.js';
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
    <div className="rounded-md border border-[color-mix(in_srgb,var(--color-theme-border-default)_45%,transparent)] bg-(--color-theme-surface-warm) p-4">
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
        <label className="block">
          <span className="mb-1 block text-xs text-ink-tertiary">NAME</span>
          <input
            className="w-full rounded border border-(--color-theme-control-border) bg-(--color-theme-control-bg) px-3 py-2 text-sm text-ink"
            value={originalname}
            onChange={event => setOriginalname(event.target.value)}
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs text-ink-tertiary">LANGUAGE</span>
          <select
            className="w-full rounded border border-(--color-theme-control-border) bg-(--color-theme-control-bg) px-3 py-2 text-sm text-ink"
            value={language}
            onChange={event => setLanguage(event.target.value)}
          >
            <option value="">—</option>
            {languages.map(key => (
              <option value={key} key={key}>
                {key.toUpperCase()}
              </option>
            ))}
          </select>
        </label>
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
