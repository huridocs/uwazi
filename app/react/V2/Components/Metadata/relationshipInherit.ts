import type { ReactNode } from 'react';
import type { PropertyTypeSchema } from '#shared/types/commonTypes.js';
import { propertyTypes } from '#shared/propertyTypes.js';
import type { Entity } from '#V2/api/entities/types.js';
import {
  inheritedCellContent,
  type InheritedCellContentOptions,
} from './Components/inheritedCellContent.js';
import type { OpenEntityTarget } from './Components/ConnectionPills.js';

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
};

const PROPERTY_TYPES = new Set<string>(Object.values(propertyTypes));

const isPropertyType = (value: string): value is PropertyTypeSchema => PROPERTY_TYPES.has(value);

const inheritedPropertyOnTarget = (
  property: InheritColumnProperty,
  templates: InheritColumnTemplate[]
) => {
  const inheritPropertyId = property.inherit?.property;
  if (!inheritPropertyId || !property.content) return undefined;
  const targetTemplate = templates.find(template => template._id === property.content);
  return targetTemplate?.properties?.find(candidate => candidate._id === inheritPropertyId);
};

const inheritTargetTemplateIdFor = (
  candidate: InheritColumnProperty,
  templates: InheritColumnTemplate[]
): string | undefined =>
  candidate.inherit?.type === 'relationship'
    ? inheritedPropertyOnTarget(candidate, templates)?.content
    : undefined;

const relationshipGroupKey = (property: { content?: string; relationType?: string }): string =>
  `${property.content ?? ''}::${property.relationType ?? ''}`;

const inheritColumnLabel = (
  property: InheritColumnProperty,
  templates: InheritColumnTemplate[]
): string => inheritedPropertyOnTarget(property, templates)?.label ?? property.label;

const buildInheritColumns = (
  property: { content?: string; relationType?: string },
  metadataProperties: InheritColumnProperty[],
  templates: InheritColumnTemplate[],
  sourceMetadata?: Entity['metadata'],
  onOpenEntity?: (target: OpenEntityTarget) => void
): InheritColumn[] =>
  metadataProperties
    .filter(
      candidate =>
        candidate.type === 'relationship' &&
        candidate.inherited &&
        candidate.content === property.content &&
        candidate.relationType === property.relationType
    )
    .map(candidate => {
      const values = sourceMetadata?.[candidate.name];
      const inheritTargetTemplateId = inheritTargetTemplateIdFor(candidate, templates);
      const cellOptions: InheritedCellContentOptions = {
        onOpenEntity,
        inheritTargetTemplateId,
      };
      const cellsByEntityId: Record<string, ReactNode> = {};
      (values ?? []).forEach(row => {
        const entityId = String(row.value ?? '');
        if (entityId) {
          cellsByEntityId[entityId] = inheritedCellContent([row], entityId, cellOptions);
        }
      });
      const inheritType = candidate.inherit?.type;
      return {
        label: inheritColumnLabel(candidate, templates),
        ...(inheritType && isPropertyType(inheritType) ? { inheritedType: inheritType } : {}),
        cellsByEntityId,
      };
    });

export { relationshipGroupKey, buildInheritColumns, inheritColumnLabel };
export type { InheritColumn, InheritColumnTemplate, InheritColumnProperty };
