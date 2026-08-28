import React, { useMemo } from 'react';
import { useAtomValue } from 'jotai';
import { LinkIcon } from '@heroicons/react/24/outline';
import { Translate } from '#app/I18N/index.js';
import { relationshipTypesAtom } from '#V2/atoms/relationshipTypes.js';
import { RelationshipMetadataProperty } from '#V2/formatters/types.js';
import { MetadataCard } from './MetadataCard.js';
import { RelationCaption } from './RelationCaption.js';
import {
  ConnectionPills,
  isEntityRelationshipValue,
  type OpenEntityTarget,
} from './ConnectionPills.js';
import { RelationshipConnectionsTable } from './RelationshipConnectionsTable.js';
import type { InheritColumn } from '../relationshipInherit.js';

type RelationshipProps = {
  label: string;
  translationContext: string;
  hideLabel?: boolean;
  className?: string;
  values: RelationshipMetadataProperty['values'];
  relationTypeId?: string;
  targetTemplateId?: string;
  columns?: InheritColumn[];
  inheritLabels?: string[];
  inheritLabel?: string;
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
  columns: columnsProp,
  inheritLabels,
  inheritLabel,
  onOpenEntity,
}: RelationshipProps) => {
  const relationshipTypes = useAtomValue(relationshipTypesAtom);
  const relationLabel = useMemo(() => {
    const typeName = relationshipTypes.find(type => type._id === relationTypeId)?.name;
    return typeName || label;
  }, [label, relationTypeId, relationshipTypes]);

  if (!Array.isArray(values) || !values.length || !values.every(isEntityRelationshipValue)) {
    return null;
  }

  const rows = values.map(value => ({
    id: value._id,
    label: value.title,
    templateId: value.templateId,
    authorized: value.authorized,
    icon: value.icon,
  }));

  const columns =
    columnsProp ??
    (inheritLabel
      ? [
          {
            label: inheritLabel,
            cellsByEntityId: {},
          },
        ]
      : []);

  const resolvedInheritLabels =
    inheritLabels ??
    (columns.length > 0
      ? columns.map(column => column.label)
      : inheritLabel
        ? [inheritLabel]
        : undefined);
  const showsInheritedTable = columns.length > 0;

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
        <RelationCaption relationLabel={relationLabel} inheritLabels={resolvedInheritLabels} />
        {showsInheritedTable ? (
          <RelationshipConnectionsTable
            rows={rows}
            columns={columns}
            translationContext={translationContext}
            targetTemplateId={targetTemplateId}
            onEntityClick={
              onOpenEntity
                ? row =>
                    onOpenEntity({
                      sharedId: row.id,
                      title: row.label,
                      templateId: row.templateId || targetTemplateId || '',
                    })
                : undefined
            }
          />
        ) : (
          <ConnectionPills
            values={values}
            targetTemplateId={targetTemplateId}
            onOpenEntity={onOpenEntity}
          />
        )}
      </dd>
    </MetadataCard>
  );
};

export { Relationship };
