import React, { useMemo } from 'react';
import { useAtomValue } from 'jotai';
import { LinkIcon } from '@heroicons/react/24/outline';
import { Translate } from '#app/I18N/index.js';
import { relationshipTypesAtom } from '#V2/atoms/relationshipTypes.js';
import { RelationshipMetadataProperty } from '#V2/formatters/types.js';
import { MetadataCard } from './MetadataCard.js';
import { RelationCaption } from './RelationCaption.js';
import { ConnectionPills, isEntityRelationshipValue } from './ConnectionPills.js';

type RelationshipProps = {
  label: string;
  translationContext: string;
  hideLabel?: boolean;
  className?: string;
  values: RelationshipMetadataProperty['values'];
  relationTypeId?: string;
  targetTemplateId?: string;
  inheritLabel?: string;
  inheritedContent?: React.ReactNode;
};

const Relationship = ({
  label,
  translationContext,
  hideLabel,
  className,
  values,
  relationTypeId,
  targetTemplateId,
  inheritLabel,
  inheritedContent,
}: RelationshipProps) => {
  const relationshipTypes = useAtomValue(relationshipTypesAtom);
  const relationLabel = useMemo(() => {
    const typeName = relationshipTypes.find(type => type._id === relationTypeId)?.name;
    return typeName || label;
  }, [label, relationTypeId, relationshipTypes]);

  if (!Array.isArray(values) || !values.length || !values.every(isEntityRelationshipValue)) {
    return null;
  }

  return (
    <MetadataCard className={className}>
      <dt className="flex items-center gap-1.5">
        <LinkIcon className="h-3.5 w-3.5 shrink-0 text-carbon" aria-hidden="true" />
        <Translate
          className={hideLabel ? 'sr-only' : 'text-sm font-bold leading-tight text-ink'}
          context={translationContext}
        >
          {label}
        </Translate>
      </dt>
      <dd className="mt-1 flex flex-col gap-1.5">
        <RelationCaption relationLabel={relationLabel} inheritLabel={inheritLabel} />
        <ConnectionPills values={values} targetTemplateId={targetTemplateId} />
        {inheritedContent || null}
      </dd>
    </MetadataCard>
  );
};

export { Relationship };
