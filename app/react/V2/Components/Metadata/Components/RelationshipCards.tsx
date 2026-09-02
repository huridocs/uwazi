import React, { ReactNode, useMemo } from 'react';
import type { ClientProperty, ClientTemplateSchema } from '#V2/shared/types.js';
import type { RelationshipMetadataProperty } from '#V2/formatters/types.js';
import type { Entity } from '#V2/api/entities/types.js';
import {
  inheritGroupKey,
  isInheritingRelationship,
  groupInheritingRelationships,
} from '../metadataPropertyLayout.js';
import { buildInheritColumns, type InheritColumnProperty } from '../relationshipInherit.js';
import { Relationship } from './Relationship.js';
import type { OpenEntityTarget } from './ConnectionPills.js';

type RelationshipCardsProps = {
  fields: RelationshipMetadataProperty[];
  translationContext: string;
  templatePropertyById: Map<string, ClientProperty>;
  templates?: ClientTemplateSchema[];
  entity?: Entity;
  onOpenEntity?: (target: OpenEntityTarget) => void;
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

const linkOnlyCard = (field: RelationshipMetadataProperty, ctx: CardRenderContext): ReactNode => {
  const templateProperty = ctx.templatePropertyById.get(field._id);
  return (
    <Relationship
      key={field._id}
      values={field.values}
      label={field.label}
      translationContext={ctx.translationContext}
      hideLabel={field.hideLabel}
      className={ctx.relationshipClassName}
      relationTypeId={templateProperty?.relationType}
      targetTemplateId={field.relationShipTarget || templateProperty?.content}
      onOpenEntity={ctx.onOpenEntity}
    />
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
    <Relationship
      key={groupKey}
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
  );
};

const cardRenderContext = ({
  translationContext,
  templatePropertyById,
  templates = [],
  entity,
  onOpenEntity,
  relationshipClassName,
}: BuildRelationshipCardNodesArgs): CardRenderContext => ({
  translationContext,
  templatePropertyById,
  templates,
  entity,
  onOpenEntity,
  relationshipClassName,
});

const linkedRelationshipFields = ({
  fields,
  inheritingOnly = false,
}: Pick<BuildRelationshipCardNodesArgs, 'fields' | 'inheritingOnly'>) =>
  fields.filter(field => {
    if (!hasLinkedEntities(field)) {
      return false;
    }
    return !(inheritingOnly && !isInheritingRelationship(field));
  });

const buildInheritingCardsByGroupKey = (
  args: BuildRelationshipCardNodesArgs
): Map<string, ReactNode> => {
  const linked = linkedRelationshipFields(args);
  const ctx = cardRenderContext(args);
  const cards = new Map<string, ReactNode>();
  groupInheritingRelationships(linked, args.templatePropertyById).forEach((siblings, groupKey) => {
    cards.set(groupKey, inheritingGroupCard(siblings, groupKey, ctx));
  });
  return cards;
};

const buildRelationshipCardNodes = (args: BuildRelationshipCardNodesArgs): ReactNode[] => {
  const linked = linkedRelationshipFields(args);
  const ctx = cardRenderContext(args);
  const inheritingByGroup = groupInheritingRelationships(linked, args.templatePropertyById);
  const nodes: ReactNode[] = [];

  linked.forEach(field => {
    if (!isInheritingRelationship(field)) {
      nodes.push(linkOnlyCard(field, ctx));
      return;
    }

    const groupKey = inheritGroupKey(field, args.templatePropertyById);
    const siblings = inheritingByGroup.get(groupKey);
    if (!siblings || siblings[0] !== field) {
      return;
    }
    nodes.push(inheritingGroupCard(siblings, groupKey, ctx));
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

  return <div className="flex flex-col gap-3">{list}</div>;
};

export { RelationshipCards, buildRelationshipCardNodes, buildInheritingCardsByGroupKey };
export type { BuildRelationshipCardNodesArgs };
