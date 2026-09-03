import React from 'react';
import { Translate } from '#app/I18N/index.js';

type RelationCaptionProps = {
  relationLabel: string;
  inheritLabel?: string;
  inheritLabels?: string[];
};

const inheritLabelsFromColumns = (
  columns: { label: string }[],
  inheritLabel?: string,
  inheritLabels?: string[]
) => {
  if (inheritLabels && inheritLabels.length > 0) {
    return inheritLabels;
  }
  if (columns.length > 0) {
    return columns.map(column => column.label);
  }
  if (inheritLabel) {
    return [inheritLabel];
  }
  return undefined;
};

const inheritSuffix = (inheritLabel?: string, inheritLabels?: string[]) => {
  if (inheritLabels && inheritLabels.length > 0) {
    return (
      <>
        {' '}
        · <Translate>inherits</Translate> {inheritLabels.join(', ')}
      </>
    );
  }
  if (inheritLabel) {
    return (
      <>
        {' '}
        · <Translate>inherits</Translate> {inheritLabel}
      </>
    );
  }
  return (
    <>
      {' '}
      · <Translate>linked</Translate>
    </>
  );
};

const RelationCaption = ({ relationLabel, inheritLabel, inheritLabels }: RelationCaptionProps) => (
  <p className="-mt-1 text-[11px] text-ink-tertiary">
    <Translate>via</Translate> <span className="font-medium text-carbon">{relationLabel}</span>
    {inheritSuffix(inheritLabel, inheritLabels)}
  </p>
);

export { RelationCaption, inheritLabelsFromColumns };
