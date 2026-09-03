import React, { ReactNode } from 'react';
import type { ClientProperty } from '#V2/shared/types.js';
import {
  RelationshipMetadataProperty,
  RelatedRelationshipMetadataProperty,
} from '#V2/formatters/types.js';
import { EntityOverlayPill, type OpenEntityTarget } from './EntityOverlayPill.js';

type RelationshipEntityValue = RelatedRelationshipMetadataProperty['values'][number];

type ConnectionPillsProps = {
  values: RelationshipEntityValue[];
  targetTemplateId?: string;
  onOpenEntity?: (target: OpenEntityTarget) => void;
};

type ConnectionPillsForFieldOptions = {
  onOpenEntity?: (target: OpenEntityTarget) => void;
};

const isEntityRelationshipValue = (
  value: RelationshipMetadataProperty['values'][number]
): value is RelationshipEntityValue => 'title' in value;

const ConnectionPills = ({ values, targetTemplateId, onOpenEntity }: ConnectionPillsProps) => {
  if (!values.length) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {values.map((value, index) => {
        const itemKey = value._id || `rel-${index}`;
        return (
          <EntityOverlayPill
            key={itemKey}
            sharedId={value._id}
            templateId={value.templateId || targetTemplateId || ''}
            label={value.title}
            icon={value.icon}
            authorized={value.authorized}
            onOpenEntity={onOpenEntity}
          />
        );
      })}
    </div>
  );
};

const connectionPillsForField = (
  field: RelationshipMetadataProperty,
  templateProperty: ClientProperty | undefined,
  options: ConnectionPillsForFieldOptions = {}
): ReactNode => {
  if (!field.values.every(isEntityRelationshipValue) || field.values.length === 0) {
    return null;
  }
  return (
    <ConnectionPills
      values={field.values}
      targetTemplateId={field.relationShipTarget || templateProperty?.content}
      onOpenEntity={options.onOpenEntity}
    />
  );
};

export { ConnectionPills, connectionPillsForField, isEntityRelationshipValue };
export type { ConnectionPillsProps, OpenEntityTarget, RelationshipEntityValue };
