import type { ReactNode } from 'react';
import type { PropertyTypeSchema } from '#shared/types/commonTypes.js';
import type { RelationshipMetadataProperty } from '#V2/formatters/types.js';
import type { Entity } from '#V2/api/entities/types.js';
import {
  inheritedCellContent,
  inheritedCellSortKey,
  type InheritedCellContentOptions,
} from './Components/inheritedCellContent.js';
import type { OpenEntityTarget } from './Components/ConnectionPills.js';
import { isPropertyType } from './isPropertyType.js';

type InheritColumnTemplate = {
  _id?: string;
  properties?: { _id?: string; label: string; content?: string; name?: string; type?: string }[];
};

type InheritColumnProperty = {
  _id: string;
  type?: string;
  name: string;
  label: string;
  content?: string;
  relationType?: string;
  inherited?: boolean;
  inherit?: { property?: string; type?: string };
};

type InheritColumn = {
  label: string;
  inheritedType?: PropertyTypeSchema;
  cellsByEntityId?: Record<string, ReactNode>;
  sortKeyByEntityId?: Record<string, string>;
};

const inheritedPropertyOnTarget = (
  property: InheritColumnProperty,
  templates: InheritColumnTemplate[]
) => {
  const inheritPropertyId = property.inherit?.property;
  if (!inheritPropertyId || !property.content) return undefined;
  const targetTemplate = templates.find(template => template._id === property.content);
  return targetTemplate?.properties?.find(candidate => candidate._id === inheritPropertyId);
};

type RelationshipGroupProperty = {
  content?: string;
  relationType?: string;
  inherited?: boolean;
  inherit?: InheritColumnProperty['inherit'];
};

const inheritsValue = (property: RelationshipGroupProperty): boolean =>
  Boolean(property.inherited || property.inherit);

const relationshipGroupKey = (property: RelationshipGroupProperty): string =>
  inheritsValue(property)
    ? `inherit::${property.content ?? ''}`
    : `${property.content ?? ''}::${property.relationType ?? ''}`;

const inheritColumnLabel = (
  property: InheritColumnProperty,
  templates: InheritColumnTemplate[]
): string => inheritedPropertyOnTarget(property, templates)?.label ?? property.label;

type InheritColumnContext = {
  templates: InheritColumnTemplate[];
  sourceMetadata?: Entity['metadata'];
  onOpenEntity?: (target: OpenEntityTarget) => void;
};

const buildInheritColumns = (
  property: RelationshipGroupProperty,
  metadataProperties: InheritColumnProperty[],
  { templates, sourceMetadata, onOpenEntity }: InheritColumnContext
): InheritColumn[] =>
  metadataProperties
    .filter(
      candidate =>
        candidate.type === 'relationship' &&
        candidate.inherited &&
        candidate.content === property.content &&
        (inheritsValue(property) || candidate.relationType === property.relationType)
    )
    .map(candidate => {
      const values = sourceMetadata?.[candidate.name];
      const inheritedTarget = inheritedPropertyOnTarget(candidate, templates);
      const inheritTargetTemplateId =
        candidate.inherit?.type === 'relationship' ? inheritedTarget?.content : undefined;
      const cellOptions: InheritedCellContentOptions = {
        ...(onOpenEntity ? { onOpenEntity } : {}),
        ...(inheritTargetTemplateId ? { inheritTargetTemplateId } : {}),
      };
      const cellsByEntityId: Record<string, ReactNode> = {};
      const sortKeyByEntityId: Record<string, string> = {};
      (values ?? []).forEach(row => {
        const entityId = String(row.value ?? '');
        if (entityId) {
          cellsByEntityId[entityId] = inheritedCellContent([row], entityId, cellOptions);
          sortKeyByEntityId[entityId] = inheritedCellSortKey([row], entityId);
        }
      });
      const inheritType = candidate.inherit?.type;
      return {
        label: inheritedTarget?.label ?? candidate.label,
        ...(inheritType && isPropertyType(inheritType) ? { inheritedType: inheritType } : {}),
        cellsByEntityId,
        sortKeyByEntityId,
      };
    });

const anchorInheritGroup = (
  siblings: RelationshipMetadataProperty[]
): RelationshipMetadataProperty[] =>
  siblings[0] && siblings.some(field => field.values.some(value => 'title' in value))
    ? [siblings[0]]
    : [];

export { relationshipGroupKey, buildInheritColumns, inheritColumnLabel, anchorInheritGroup };
export type { InheritColumn, InheritColumnTemplate, InheritColumnProperty };
