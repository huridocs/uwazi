/* eslint-disable react/no-multi-comp */
import React from 'react';
import { CheckIcon } from '@heroicons/react/20/solid';
import { Translate } from '#app/I18N/index.js';
import type { Entity } from '#V2/api/entities/types.js';
import { TemplateLabel } from '#V2/Components/Metadata/Components/index.js';
import { Button } from '#V2/Components/UI/index.js';
import { MetadataRecord } from '#V2/Components/Metadata/MetadataRecord.js';
import type { CopyFromMatchingProperty } from './copyFromMatchingProperties.js';

type CopyFromSourcePreviewProps = {
  source: Entity;
  matchingProperties: CopyFromMatchingProperty[];
  templateId?: string;
  onStage: () => void;
  onPickAnother: () => void;
};

const CopyFromSourcePreview = ({
  source,
  matchingProperties,
  templateId,
  onStage,
  onPickAnother,
}: CopyFromSourcePreviewProps) => {
  const matchCount = matchingProperties.length;

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="px-5 pt-4">
        <div className="rounded-lg bg-warm px-4 py-3">
          <div className="flex items-start justify-between gap-3">
            <p className="text-micro font-semibold uppercase tracking-[0.08em] text-ink-tertiary">
              <Translate>Copy from this entity</Translate>
            </p>
            <p className="text-xs text-ink-secondary">
              {matchCount}{' '}
              <Translate>{matchCount === 1 ? 'field matches' : 'fields match'}</Translate>
            </p>
          </div>
          <ul className="mt-2 space-y-1">
            {matchingProperties.map(property => (
              <li key={property.name} className="flex items-center gap-2 text-sm text-ink">
                <CheckIcon className="h-4 w-4 shrink-0 text-success" aria-hidden="true" />
                <Translate context={templateId}>{property.label}</Translate>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex items-center gap-3">
            <Button variant="primary" disabled={matchCount === 0} onClick={onStage}>
              <Translate>Stage</Translate> {matchCount}{' '}
              <Translate>{matchCount === 1 ? 'field' : 'fields'}</Translate>
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
      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
        <div className="mb-3">
          <span className="inline-flex rounded-md bg-warm px-2 py-1 text-xs font-medium text-ink">
            <Translate>Metadata</Translate>
          </span>
        </div>
        <MetadataRecord entity={source} showDocumentPreview={false} />
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
