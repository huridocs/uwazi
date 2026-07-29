import React from 'react';
import { Translate } from '#app/I18N/index.js';
import type { ClientProperty, ClientTemplateSchema } from '#V2/shared/types.js';
import type { MetadataProperty, RelationshipMetadataProperty } from '#V2/formatters/types.js';
import {
  FULL_ROW_METADATA_FIELD_LAYOUT,
  isInheritingRelationship,
} from '../metadataPropertyLayout.js';
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
  masonry?: boolean;
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

const RelationshipCards = ({
  fields,
  translationContext,
  templatePropertyById,
  templates,
  inheritingTerminalById,
  inheritingOnly = false,
  masonry = false,
}: RelationshipCardsProps) => {
  const visibleFields = fields.filter(field => {
    if (!hasLinkedEntities(field)) {
      return false;
    }
    if (inheritingOnly && !isInheritingRelationship(field)) {
      return false;
    }
    return true;
  });

  if (!visibleFields.length) {
    return null;
  }

  const list = visibleFields.map(data => {
    const templateProperty = templatePropertyById.get(data._id);
    const terminal = inheritingTerminalById?.get(data._id);
    const inheritedContent = terminal ? renderFieldContent(terminal, true) : null;
    return (
      <div key={data._id} data-field-key={data._id}>
        <Relationship
          values={data.values}
          label={data.label}
          translationContext={translationContext}
          hideLabel={data.hideLabel}
          className={masonry ? FULL_ROW_METADATA_FIELD_LAYOUT : undefined}
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

  return (
    <>
      <div
        className={`mt-2 flex w-full min-w-0 items-center ${masonry ? 'basis-full' : ''}`.trim()}
      >
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-tertiary">
          <Translate>Relationships</Translate>
        </p>
      </div>
      {masonry ? (
        <dl className="flex min-w-0 flex-wrap gap-3">{list}</dl>
      ) : (
        <div className="flex flex-col gap-3">{list}</div>
      )}
    </>
  );
};

export { RelationshipCards };
