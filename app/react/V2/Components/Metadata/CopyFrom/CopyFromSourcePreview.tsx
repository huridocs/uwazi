/* eslint-disable react/no-multi-comp */
import React, { useEffect, useState } from 'react';
import { useAtomValue } from 'jotai';
import { useWatch } from 'react-hook-form';
import { ArrowRightIcon } from '@heroicons/react/20/solid';
import { Translate } from '#app/I18N/index.js';
import { localeAtom } from '#V2/atoms/translationsAtoms.js';
import type { Entity } from '#V2/api/entities/types.js';
import type { MetadataValue } from '#V2/formatters/types.js';
import { metadataDisplayPresets } from '#V2/Components/Metadata/display/index.js';
import { TemplateLabel } from '#V2/Components/Metadata/Components/index.js';
import { Button } from '#V2/Components/UI/index.js';
import {
  copyFromValuesAreEqual,
  formatCopyFromValue,
  type CopyFromDisplayValue,
} from './copyFromFieldValue.js';
import type { CopyFromMatchingProperty } from './copyFromMatchingProperties.js';

type CopyFromSourcePreviewProps = {
  source: Entity;
  matchingProperties: CopyFromMatchingProperty[];
  templateId?: string;
  onStage: (selectedNames: string[]) => void;
  onPickAnother: () => void;
};

type CopyFromFieldDiffProps = {
  property: CopyFromMatchingProperty;
  templateId?: string;
  currentValue?: CopyFromDisplayValue[];
  sourceValue?: CopyFromDisplayValue[];
  checked: boolean;
  onToggle: () => void;
};

const CopyFromFieldDiff = ({
  property,
  templateId,
  currentValue,
  sourceValue,
  checked,
  onToggle,
}: CopyFromFieldDiffProps) => {
  const locale = useAtomValue(localeAtom);
  const displayContext = { ...metadataDisplayPresets.rich, locale };
  const currentFormatted = formatCopyFromValue(currentValue, property, displayContext);
  const sourceFormatted = formatCopyFromValue(sourceValue, property, displayContext);
  const sameValue = copyFromValuesAreEqual(currentValue, sourceValue);

  return (
    <li className="rounded-md bg-paper/80 px-3 py-3">
      <label className="flex min-w-0 items-start gap-3">
        <input
          type="checkbox"
          className="mt-1 h-3.5 w-3.5 shrink-0 cursor-pointer rounded accent-ink"
          aria-label={property.label}
          checked={checked}
          onChange={onToggle}
        />
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-medium text-ink">
            <Translate context={templateId}>{property.label}</Translate>
          </span>
          <span className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
            {currentFormatted ? (
              <span className="text-ink-muted line-through">{currentFormatted}</span>
            ) : null}
            <ArrowRightIcon className="h-3.5 w-3.5 shrink-0 text-ink-tertiary" aria-hidden="true" />
            <span className="font-semibold text-ink">{sourceFormatted}</span>
          </span>
          {sameValue ? (
            <span className="mt-1 block text-xs text-ink-muted">
              <Translate>Already the same value.</Translate>
            </span>
          ) : null}
        </span>
      </label>
    </li>
  );
};

const CopyFromSourcePreview = ({
  source,
  matchingProperties,
  templateId,
  onStage,
  onPickAnother,
}: CopyFromSourcePreviewProps) => {
  const currentMetadata =
    (useWatch({ name: 'metadata' }) as Record<string, MetadataValue[]> | undefined) ?? {};
  const [selectedNames, setSelectedNames] = useState<string[]>([]);
  const selectedCount = selectedNames.length;
  const matchCount = matchingProperties.length;

  useEffect(() => {
    setSelectedNames(matchingProperties.map(property => property.name));
  }, [matchingProperties]);

  const toggleProperty = (name: string) => {
    setSelectedNames(current =>
      current.includes(name) ? current.filter(selected => selected !== name) : [...current, name]
    );
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-5 py-4">
      <div className="flex min-h-0 flex-1 flex-col rounded-lg bg-warm p-4">
        <div className="flex shrink-0 items-start justify-between gap-3">
          <p className="text-micro font-semibold uppercase tracking-[0.08em] text-ink-tertiary">
            <Translate>Copy from this entity</Translate>
          </p>
          <p className="text-xs text-ink-secondary">
            {matchCount}{' '}
            <Translate>{matchCount === 1 ? 'field matches' : 'fields match'}</Translate>
          </p>
        </div>
        <ul className="mt-4 min-h-0 flex-1 space-y-4 overflow-y-auto">
          {matchingProperties.map(property => (
            <CopyFromFieldDiff
              key={property.name}
              property={property}
              templateId={templateId}
              currentValue={currentMetadata[property.name]}
              sourceValue={source.metadata?.[property.name]}
              checked={selectedNames.includes(property.name)}
              onToggle={() => toggleProperty(property.name)}
            />
          ))}
        </ul>
        <div className="mt-4 flex shrink-0 items-center gap-3">
          <Button
            variant="primary"
            disabled={selectedCount === 0}
            onClick={() => onStage(selectedNames)}
          >
            <Translate>Copy</Translate> {selectedCount}{' '}
            <Translate>{selectedCount === 1 ? 'field' : 'fields'}</Translate>
          </Button>
          <button
            type="button"
            className="text-xs font-medium text-ink-secondary hover:text-ink"
            onClick={onPickAnother}
          >
            <Translate>Pick another</Translate>
          </button>
        </div>
      </div>
    </div>
  );
};

const CopyFromSourceHeader = ({ source }: { source: Entity }) => (
  <div className="min-w-0">
    <TemplateLabel templateId={source.template} variant="tag" />
    <h2 className="mt-1 truncate text-base font-semibold text-ink">{source.title}</h2>
  </div>
);

export { CopyFromSourceHeader, CopyFromSourcePreview };
export type { CopyFromSourcePreviewProps };
