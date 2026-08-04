import React, { ReactNode } from 'react';
import { Translate } from '#app/I18N/index.js';
import type { ClientProperty, ClientTemplateSchema } from '#V2/shared/types.js';
import type { MetadataProperty, RelationshipMetadataProperty } from '#V2/formatters/types.js';
import { isInheritingRelationship } from '../metadataPropertyLayout.js';
import { renderFieldContent } from './metadataFieldContent.js';
import { Relationship } from './Relationship.js';

type RelationshipCardsProps = {
  fields: RelationshipMetadataProperty[];
  translationContext: string;
  templatePropertyById: Map<string, ClientProperty>;
  templates?: ClientTemplateSchema[];
  inheritingTerminalById?: Map<string, MetadataProperty>;
  /** Skip link-only connections — host renders those in the Details table. */
  inheritingOnly?: boolean;
};

type BuildRelationshipCardNodesArgs = {
  fields: RelationshipMetadataProperty[];
  translationContext: string;
  templatePropertyById: Map<string, ClientProperty>;
  templates?: ClientTemplateSchema[];
  inheritingTerminalById?: Map<string, MetadataProperty>;
  inheritingOnly?: boolean;
  relationshipClassName?: string;
};

const hasLinkedEntities = (field: RelationshipMetadataProperty): boolean =>
  Array.isArray(field.values) &&
  field.values.length > 0 &&
  field.values.every(value => typeof value === 'object' && value !== null && 'title' in value);

const inheritLabelForProperty = (
  templateProperty: ClientProperty | undefined,
  templates: ClientTemplateSchema[] | undefined
): string | undefined => {
  const inheritPropertyId = templateProperty?.inherit?.property;
  if (!inheritPropertyId || !templates?.length) {
    return undefined;
  }
  for (const template of templates) {
    const match = template.properties?.find(property => property._id === inheritPropertyId);
    if (match?.label) {
      return match.label;
    }
  }
  return undefined;
};

const buildRelationshipCardNodes = ({
  fields,
  translationContext,
  templatePropertyById,
  templates,
  inheritingTerminalById,
  inheritingOnly = false,
  relationshipClassName,
}: BuildRelationshipCardNodesArgs): ReactNode[] =>
  fields
    .filter(field => {
      if (!hasLinkedEntities(field)) {
        return false;
      }
      if (inheritingOnly && !isInheritingRelationship(field)) {
        return false;
      }
      return true;
    })
    .map(data => {
      const templateProperty = templatePropertyById.get(data._id);
      const terminal = inheritingTerminalById?.get(data._id);
      const inheritedContent = terminal ? renderFieldContent(terminal, true) : null;
      return (
        <div key={data._id} data-field-key={data.name}>
          <Relationship
            values={data.values}
            label={data.label}
            translationContext={translationContext}
            hideLabel={data.hideLabel}
            className={relationshipClassName}
            relationTypeId={templateProperty?.relationType}
            targetTemplateId={data.relationShipTarget || templateProperty?.content}
            inheritLabel={
              isInheritingRelationship(data)
                ? inheritLabelForProperty(templateProperty, templates)
                : undefined
            }
            inheritedContent={inheritedContent || undefined}
          />
        </div>
      );
    });

const RelationshipCards = ({
  fields,
  translationContext,
  templatePropertyById,
  templates,
  inheritingTerminalById,
  inheritingOnly = false,
}: RelationshipCardsProps) => {
  const list = buildRelationshipCardNodes({
    fields,
    translationContext,
    templatePropertyById,
    templates,
    inheritingTerminalById,
    inheritingOnly,
  });

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
