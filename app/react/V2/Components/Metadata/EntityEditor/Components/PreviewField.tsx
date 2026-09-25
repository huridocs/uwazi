import React from 'react';
import { useWatch } from 'react-hook-form';
import { Translate } from '#app/I18N/index.js';
import { stringFromValues } from '../functions/entityTranslations.js';
import { EntityField } from './EntityField.js';

type PreviewFieldProps = {
  context: string;
  label: string;
  field: string;
};

const previewSrc = (value: unknown) => {
  if (typeof value === 'string') return value || undefined;
  return stringFromValues(Array.isArray(value) ? value : undefined) || undefined;
};

const PreviewField = ({ context, label, field }: PreviewFieldProps) => {
  const value = previewSrc(useWatch({ name: field }));
  return (
    <EntityField>
      <div className="text-sm font-normal text-ink">
        <Translate context={context}>{label}</Translate>
      </div>
      <p className="mb-3 text-sm text-ink-secondary">
        <Translate>This content is automatically generated</Translate>
      </p>
      {value ? (
        <div className="rounded-md bg-(--color-theme-surface-warm) p-3">
          <img
            src={value}
            alt={label}
            className="mx-auto max-h-48 w-full rounded-md object-contain"
          />
        </div>
      ) : null}
    </EntityField>
  );
};

export { PreviewField };
