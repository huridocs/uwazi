import React from 'react';
import { Translate } from '#app/I18N/index.js';
import { useAtomValue } from 'jotai';
import { XMarkIcon } from '@heroicons/react/20/solid';
import { Select } from '#V2/Components/Forms/Select.js';
import { InputField } from '#V2/Components/Forms/InputField.js';
import { templatesAtom } from '#V2/atoms/index.js';
import type { DatavizSource } from '#V2/Dataviz/types/definition.js';

type DataSourceRowProps = {
  source: DatavizSource;
  index: number;
  showAlias: boolean;
  canRemove: boolean;
  onChange: (source: DatavizSource) => void;
  onRemove: () => void;
};

const DataSourceRow = ({
  source,
  index,
  showAlias,
  canRemove,
  onChange,
  onRemove,
}: DataSourceRowProps) => {
  const templates = useAtomValue(templatesAtom);
  const templateOptions = [
    { value: '', label: 'Select template…' },
    ...templates.filter(t => t._id).map(t => ({ value: t._id!, label: t.name })),
  ];

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-ink-secondary">
          <Translate>Source</Translate> {index + 1}
        </span>
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="text-ink-muted hover:text-ink"
            aria-label="Remove data source"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        )}
      </div>
      <Select
        id={`source-template-${index}`}
        label="Template"
        value={source.templateId}
        options={templateOptions}
        onChange={e => onChange({ ...source, templateId: e.target.value })}
      />
      {showAlias && (
        <InputField
          id={`source-alias-${index}`}
          label="Alias"
          value={source.alias || ''}
          placeholder="e.g. hombres"
          onChange={e => onChange({ ...source, alias: e.target.value })}
        />
      )}
    </div>
  );
};

export { DataSourceRow };
