import React from 'react';
import { LinkIcon } from '@heroicons/react/24/outline';
import { Translate } from '#app/I18N/index.js';

type RelationCaptionProps = {
  relationLabel: string;
  fieldTitle: string;
};

const sameRelationLabel = (fieldTitle: string, relationLabel: string) =>
  fieldTitle.trim().localeCompare(relationLabel.trim(), undefined, { sensitivity: 'base' }) === 0;

const RelationCaption = ({ relationLabel, fieldTitle }: RelationCaptionProps) => {
  if (sameRelationLabel(fieldTitle, relationLabel)) {
    return null;
  }

  return (
    <p className="flex min-w-0 items-center gap-1 text-meta text-ink-tertiary">
      <LinkIcon className="h-3 w-3 shrink-0 text-carbon" aria-hidden />
      <span>
        <Translate className="sr-only">Relationship:</Translate> {relationLabel}
      </span>
    </p>
  );
};

export { RelationCaption };
