import React, { ReactNode, useMemo } from 'react';
import type { ClientProperty, ClientTemplateSchema } from '#V2/shared/types.js';
import type { RelationshipMetadataProperty } from '#V2/formatters/types.js';
import type { Entity } from '#V2/api/entities/types.js';
import { inheritGroupKey, groupInheritingRelationships } from '../metadataPropertyLayout.js';
import { buildInheritColumns, type InheritColumnProperty } from '../relationshipInherit.js';
import { Relationship } from './Relationship.js';
import {
  isEntityRelationshipValue,
  type OpenEntityTarget,
  type RelationshipEntityValue,
} from './ConnectionPills.js';

type RelationshipCardsProps = {
  fields: RelationshipMetadataProperty[];
  translationContext: string;
  templatePropertyById: Map<string, ClientProperty>;
  templates?: ClientTemplateSchema[];
  entity?: Entity;
  onOpenEntity?: (target: OpenEntityTarget) => void;
};

type BuildRelationshipCardNodesArgs = {
  fields: RelationshipMetadataProperty[];
  translationContext: string;
  templatePropertyById: Map<string, ClientProperty>;
  templates?: ClientTemplateSchema[];
  entity?: Entity;
  onOpenEntity?: (target: OpenEntityTarget) => void;
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
  field.values.some(isEntityRelationshipValue);

const entityValues = (fields: RelationshipMetadataProperty[]): RelationshipEntityValue[] => {
  const seen = new Set<string>();
  const rows: RelationshipEntityValue[] = [];
  fields.forEach(field => {
    field.values.forEach(value => {
      if (!isEntityRelationshipValue(value) || seen.has(value._id)) {
        return;
      }
      seen.add(value._id);
      rows.push(value);
    });
  });
  return rows;
};

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
  inherited: field.inherited,
  inherit: templateProperty?.inherit,
});

const linkOnlyCard = (field: RelationshipMetadataProperty, ctx: CardRenderContext): ReactNode => {
  const templateProperty = ctx.templatePropertyById.get(field._id);
  return (
    <Relationship
      key={field._id}
      values={entityValues([field])}
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

const clusterTitle = (siblings: RelationshipMetadataProperty[], title?: string) => {
  const inherited = siblings.filter(field => field.inherited);
  const [primary] = inherited.length === 1 ? inherited : siblings;
  if (inherited.length > 1 && inherited.length < siblings.length && title) {
    return { label: title, hideLabel: false };
  }
  return { label: primary.label, hideLabel: primary.hideLabel };
};

const inheritingGroupCard = (
  siblings: RelationshipMetadataProperty[],
  groupKey: string,
  ctx: CardRenderContext
): ReactNode => {
  const [primary] = siblings;
  const title = clusterTitle(siblings, ctx.entity?.title);
  const primaryTpl = ctx.templatePropertyById.get(primary._id);
  const columns = buildInheritColumns(
    {
      content: primaryTpl?.content,
      relationType: primaryTpl?.relationType,
    },
    siblings.map(sibling =>
      toInheritColumnProperty(sibling, ctx.templatePropertyById.get(sibling._id))
    ),
    {
      templates: ctx.templates,
      sourceMetadata: ctx.entity?.metadata,
      onOpenEntity: ctx.onOpenEntity,
    }
  );

  return (
    <Relationship
      key={groupKey}
      values={entityValues(siblings)}
      label={title.label}
      translationContext={ctx.translationContext}
      hideLabel={title.hideLabel}
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

const hasClusterLinks = (siblings: RelationshipMetadataProperty[]) =>
  siblings.some(hasLinkedEntities);

const buildInheritingCardsByGroupKey = (
  args: BuildRelationshipCardNodesArgs
): Map<string, ReactNode> => {
  const ctx = cardRenderContext(args);
  const cards = new Map<string, ReactNode>();
  groupInheritingRelationships(args.fields, args.templatePropertyById).forEach(
    (siblings, groupKey) => {
      if (hasClusterLinks(siblings)) {
        cards.set(groupKey, inheritingGroupCard(siblings, groupKey, ctx));
      }
    }
  );
  return cards;
};

const buildRelationshipCardNodes = (args: BuildRelationshipCardNodesArgs): ReactNode[] => {
  const ctx = cardRenderContext(args);
  const inheritingByGroup = groupInheritingRelationships(args.fields, args.templatePropertyById);
  const nodes: ReactNode[] = [];

  args.fields.forEach(field => {
    const groupKey = inheritGroupKey(field, args.templatePropertyById);
    const siblings = inheritingByGroup.get(groupKey);
    if (!siblings || !hasClusterLinks(siblings)) {
      if (hasLinkedEntities(field)) nodes.push(linkOnlyCard(field, ctx));
      return;
    }
    if (siblings[0] === field) nodes.push(inheritingGroupCard(siblings, groupKey, ctx));
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
      }),
    [fields, translationContext, templatePropertyById, templates, entity, onOpenEntity]
  );

  if (!list.length) {
    return null;
  }

  return <div className="flex flex-col gap-3">{list}</div>;
};

export { RelationshipCards, buildRelationshipCardNodes, buildInheritingCardsByGroupKey };
export type { BuildRelationshipCardNodesArgs };
