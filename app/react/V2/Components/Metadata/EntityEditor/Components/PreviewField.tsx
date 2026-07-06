import React from 'react';
import { Translate } from '#app/I18N/index.js';

type PreviewFieldProps = {
  context: string;
  label: string;
  value?: string;
};

const PreviewField = ({ context, label, value }: PreviewFieldProps) => (
  <div className="text-ink bg-(--bg-surface)">
    <div className="mb-2 font-bold">
      <Translate context={context}>{label}</Translate>
    </div>
    <p className="mb-3 text-sm text-ink-secondary">
      <Translate>This content is automatically generated</Translate>
    </p>
    {value ? (
      <div className="rounded-md bg-(--color-theme-surface-warm) p-3">
        <img src={value} alt={label} className="mx-auto max-h-48 w-full rounded-md object-contain" />
      </div>
    ) : null}
  </div>
);

export { PreviewField };
