import type { ReactNode } from 'react';
import type { Entity } from '#V2/api/entities/types.js';
import {
  inheritedCellContent,
  type InheritedCellContentOptions,
} from './Components/inheritedCellContent.js';
import type { OpenEntityTarget } from './Components/ConnectionPills.js';

type InheritColumnTemplate = {
  _id: string;
  properties?: { _id?: string; label: string; content?: string }[];
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
  inheritedType?: string;
  inheritTargetTemplateId?: string;
  cellsByEntityId?: Record<string, ReactNode>;
};

type BuildInheritColumnsOptions = {
  onOpenEntity?: (target: OpenEntityTarget) => void;
};

const inheritTargetTemplateIdFor = (
  candidate: InheritColumnProperty,
  templates: InheritColumnTemplate[]
): string | undefined => {
  if (candidate.inherit?.type !== 'relationship') return undefined;
  const targetTemplate = templates.find(template => template._id === candidate.content);
  const inheritedProperty = targetTemplate?.properties?.find(
    property => property._id === candidate.inherit?.property
  );
  return inheritedProperty?.content;
};

const relationshipGroupKey = (property: { content?: string; relationType?: string }): string =>
  `${property.content ?? ''}::${property.relationType ?? ''}`;

const inheritColumnLabel = (
  property: InheritColumnProperty,
  templates: InheritColumnTemplate[]
): string => {
  const inheritPropertyId = property.inherit?.property;
  if (inheritPropertyId && property.content) {
    const targetTemplate = templates.find(template => template._id === property.content);
    const inheritedProperty = targetTemplate?.properties?.find(
      candidate => candidate._id === inheritPropertyId
    );
    if (inheritedProperty?.label) return inheritedProperty.label;
  }
  return property.label;
};

const buildInheritColumns = (
  property: { content?: string; relationType?: string },
  metadataProperties: InheritColumnProperty[],
  templates: InheritColumnTemplate[],
  sourceMetadata?: Entity['metadata'],
  options: BuildInheritColumnsOptions = {}
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
        ...(options.onOpenEntity ? { onOpenEntity: options.onOpenEntity } : {}),
        ...(inheritTargetTemplateId ? { inheritTargetTemplateId } : {}),
      };
      const cellsByEntityId: Record<string, ReactNode> = {};
      (values ?? []).forEach(row => {
        const entityId = String(row.value ?? '');
        if (entityId) {
          cellsByEntityId[entityId] = inheritedCellContent(values, entityId, cellOptions);
        }
      });
      return {
        label: inheritColumnLabel(candidate, templates),
        ...(candidate.inherit?.type ? { inheritedType: candidate.inherit.type } : {}),
        ...(inheritTargetTemplateId ? { inheritTargetTemplateId } : {}),
        cellsByEntityId,
      };
    });

export { relationshipGroupKey, buildInheritColumns, inheritColumnLabel };
export type {
  InheritColumn as RelationshipInheritColumn,
  InheritColumn,
  InheritColumnTemplate,
  InheritColumnProperty,
  BuildInheritColumnsOptions,
};
