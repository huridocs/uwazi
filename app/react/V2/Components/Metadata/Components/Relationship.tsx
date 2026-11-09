import React, { useMemo } from 'react';
import { useAtomValue } from 'jotai';
import { Translate } from '#app/I18N/index.js';
import { relationshipTypesAtom } from '#V2/atoms/relationshipTypes.js';
import { RelationshipMetadataProperty } from '#V2/formatters/types.js';
import { MetadataCard } from './MetadataCard.js';
import { RelationCaption } from './RelationCaption.js';
import { isEntityRelationshipValue, type OpenEntityTarget } from './ConnectionPills.js';
import { RelationshipConnectionsTable } from './RelationshipConnectionsTable.js';
import type { InheritColumn } from '../relationshipInherit.js';

const emptyColumns: InheritColumn[] = [];

type RelationshipProps = {
  label: string;
  translationContext: string;
  hideLabel?: boolean;
  className?: string;
  values: RelationshipMetadataProperty['values'];
  relationTypeId?: string;
  targetTemplateId?: string;
  columns?: InheritColumn[];
  onOpenEntity?: (target: OpenEntityTarget) => void;
};

const Relationship = ({
  label,
  translationContext,
  hideLabel,
  className,
  values,
  relationTypeId,
  targetTemplateId,
  columns = emptyColumns,
  onOpenEntity,
}: RelationshipProps) => {
  const relationshipTypes = useAtomValue(relationshipTypesAtom);
  const relationLabel = useMemo(() => {
    const typeName = relationshipTypes.find(type => type._id === relationTypeId)?.name;
    return typeName || label;
  }, [label, relationTypeId, relationshipTypes]);

  const entities = Array.isArray(values) ? values.filter(isEntityRelationshipValue) : [];
  if (!entities.length) {
    return null;
  }

  const rows = entities.map(value => ({
    id: value._id,
    label: value.title,
    templateId: value.templateId,
    authorized: value.authorized,
    icon: value.icon,
  }));

  return (
    <MetadataCard
      className={className}
      title={
        <Translate className={hideLabel ? 'sr-only' : undefined} context={translationContext}>
          {label}
        </Translate>
      }
    >
      <RelationCaption relationLabel={relationLabel} fieldTitle={label} />
      <RelationshipConnectionsTable
        rows={rows}
        columns={columns}
        translationContext={translationContext}
        targetTemplateId={targetTemplateId}
        onOpenEntity={onOpenEntity}
      />
    </MetadataCard>
  );
};

export { Relationship };
