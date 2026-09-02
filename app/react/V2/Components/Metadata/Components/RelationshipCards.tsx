import React, { ReactNode, useMemo } from 'react';
import { Translate } from '#app/I18N/index.js';
import type { ClientProperty, ClientTemplateSchema } from '#V2/shared/types.js';
import type { RelationshipMetadataProperty } from '#V2/formatters/types.js';
import type { Entity } from '#V2/api/entities/types.js';
import { isInheritingRelationship } from '../metadataPropertyLayout.js';
import {
  buildInheritColumns,
  relationshipGroupKey,
  type InheritColumnProperty,
} from '../relationshipInherit.js';
import { Relationship } from './Relationship.js';
import type { OpenEntityTarget } from './ConnectionPills.js';

type RelationshipCardsProps = {
  fields: RelationshipMetadataProperty[];
  translationContext: string;
  templatePropertyById: Map<string, ClientProperty>;
  templates?: ClientTemplateSchema[];
  entity?: Entity;
  onOpenEntity?: (target: OpenEntityTarget) => void;
  /** Skip link-only connections — host renders those in the Details table. */
  inheritingOnly?: boolean;
};

type BuildRelationshipCardNodesArgs = {
  fields: RelationshipMetadataProperty[];
  translationContext: string;
  templatePropertyById: Map<string, ClientProperty>;
  templates?: ClientTemplateSchema[];
  entity?: Entity;
  onOpenEntity?: (target: OpenEntityTarget) => void;
  inheritingOnly?: boolean;
  relationshipClassName?: string;
};

type CardRenderContext = {
  translationContext: string;
  templatePropertyById: Map<string, ClientProperty>;
  templates: ClientTemplateSchema[];
  entity?: Entity;
  onOpenEntity?: (target: OpenEntityTarget) => void;
  relationshipClassName?: string;
};

const hasLinkedEntities = (field: RelationshipMetadataProperty): boolean =>
  Array.isArray(field.values) &&
  field.values.length > 0 &&
  field.values.every(value => typeof value === 'object' && value !== null && 'title' in value);

const toInheritColumnProperty = (
  field: RelationshipMetadataProperty,
  templateProperty: ClientProperty | undefined
): InheritColumnProperty => ({
  _id: field._id,
  type: 'relationship',
  name: field.name,
  label: field.label,
  content: templateProperty?.content,
  relationType: templateProperty?.relationType,
  inherited: true,
  inherit: templateProperty?.inherit,
});

const groupKeyForField = (
  field: RelationshipMetadataProperty,
  templatePropertyById: Map<string, ClientProperty>
): string => {
  const templateProperty = templatePropertyById.get(field._id);
  return relationshipGroupKey({
    content: templateProperty?.content,
    relationType: templateProperty?.relationType,
  });
};

const linkOnlyCard = (field: RelationshipMetadataProperty, ctx: CardRenderContext): ReactNode => {
  const templateProperty = ctx.templatePropertyById.get(field._id);
  return (
    <div key={field._id} data-field-key={field.name}>
      <Relationship
        values={field.values}
        label={field.label}
        translationContext={ctx.translationContext}
        hideLabel={field.hideLabel}
        className={ctx.relationshipClassName}
        relationTypeId={templateProperty?.relationType}
        targetTemplateId={field.relationShipTarget || templateProperty?.content}
        onOpenEntity={ctx.onOpenEntity}
      />
    </div>
  );
};

const inheritingGroupCard = (
  siblings: RelationshipMetadataProperty[],
  groupKey: string,
  ctx: CardRenderContext
): ReactNode => {
  const [primary] = siblings;
  const primaryTpl = ctx.templatePropertyById.get(primary._id);
  const columns = buildInheritColumns(
    { content: primaryTpl?.content, relationType: primaryTpl?.relationType },
    siblings.map(sibling =>
      toInheritColumnProperty(sibling, ctx.templatePropertyById.get(sibling._id))
    ),
    ctx.templates,
    ctx.entity?.metadata,
    ctx.onOpenEntity
  );

  return (
    <div key={groupKey} data-field-key={primary.name}>
      <Relationship
        values={primary.values}
        label={primary.label}
        translationContext={ctx.translationContext}
        hideLabel={primary.hideLabel}
        className={ctx.relationshipClassName}
        relationTypeId={primaryTpl?.relationType}
        targetTemplateId={primary.relationShipTarget || primaryTpl?.content}
        columns={columns}
        onOpenEntity={ctx.onOpenEntity}
      />
    </div>
  );
};

const buildRelationshipCardNodes = ({
  fields,
  translationContext,
  templatePropertyById,
  templates = [],
  entity,
  onOpenEntity,
  inheritingOnly = false,
  relationshipClassName,
}: BuildRelationshipCardNodesArgs): ReactNode[] => {
  const linked = fields.filter(field => {
    if (!hasLinkedEntities(field)) {
      return false;
    }
    return !(inheritingOnly && !isInheritingRelationship(field));
  });

  const ctx: CardRenderContext = {
    translationContext,
    templatePropertyById,
    templates,
    entity,
    onOpenEntity,
    relationshipClassName,
  };

  const inheritingByGroup = new Map<string, RelationshipMetadataProperty[]>();
  linked.forEach(field => {
    if (!isInheritingRelationship(field)) return;
    const groupKey = groupKeyForField(field, templatePropertyById);
    const group = inheritingByGroup.get(groupKey);
    if (group) group.push(field);
    else inheritingByGroup.set(groupKey, [field]);
  });

  const nodes: ReactNode[] = [];
  const seenInheritGroups = new Set<string>();

  linked.forEach(field => {
    if (!isInheritingRelationship(field)) {
      nodes.push(linkOnlyCard(field, ctx));
      return;
    }

    const groupKey = groupKeyForField(field, templatePropertyById);
    if (seenInheritGroups.has(groupKey)) {
      return;
    }
    seenInheritGroups.add(groupKey);
    nodes.push(inheritingGroupCard(inheritingByGroup.get(groupKey) ?? [field], groupKey, ctx));
  });

  return nodes;
};

const RelationshipCards = ({
  fields,
  translationContext,
  templatePropertyById,
  templates,
  entity,
  onOpenEntity,
  inheritingOnly = false,
}: RelationshipCardsProps) => {
  const list = useMemo(
    () =>
      buildRelationshipCardNodes({
        fields,
        translationContext,
        templatePropertyById,
        templates,
        entity,
        onOpenEntity,
        inheritingOnly,
      }),
    [
      fields,
      translationContext,
      templatePropertyById,
      templates,
      entity,
      onOpenEntity,
      inheritingOnly,
    ]
  );

  if (!list.length) {
    return null;
  }

  return (
    <>
      <div className="mt-2 flex w-full min-w-0 items-center">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-tertiary">
          <Translate>Relationships</Translate>
        </p>
      </div>
      <div className="flex flex-col gap-3">{list}</div>
    </>
  );
};

export { RelationshipCards, buildRelationshipCardNodes };
export type { BuildRelationshipCardNodesArgs };
