import React from 'react';
import { Translate } from '#app/I18N/index.js';
import type { ClientProperty } from '#V2/shared/types.js';
import type { RelationshipMetadataProperty } from '#V2/formatters/types.js';
import { FULL_ROW_METADATA_FIELD_LAYOUT } from '../metadataPropertyLayout.js';
import { Relationship } from './Relationship.js';

type RelationshipCardsProps = {
  fields: RelationshipMetadataProperty[];
  translationContext: string;
  templatePropertyById: Map<string, ClientProperty>;
};

const hasLinkedEntities = (field: RelationshipMetadataProperty): boolean =>
  Array.isArray(field.values) &&
  field.values.length > 0 &&
  field.values.every(value => typeof value === 'object' && value !== null && 'title' in value);

const RelationshipCards = ({
  fields,
  translationContext,
  templatePropertyById,
}: RelationshipCardsProps) => {
  const visibleFields = fields.filter(hasLinkedEntities);
  if (!visibleFields.length) {
    return null;
  }

  return (
    <>
      <div className="mt-2 flex w-full min-w-0 basis-full items-center">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-tertiary">
          <Translate>Relationships</Translate>
        </p>
      </div>
      <dl className="flex min-w-0 flex-wrap gap-3">
        {visibleFields.map(data => {
          const templateProperty = templatePropertyById.get(data._id);
          return (
            <Relationship
              key={data._id}
              values={data.values}
              label={data.label}
              translationContext={translationContext}
              hideLabel={data.hideLabel}
              className={FULL_ROW_METADATA_FIELD_LAYOUT}
              relationTypeId={templateProperty?.relationType}
              targetTemplateId={data.relationShipTarget || templateProperty?.content}
            />
          );
        })}
      </dl>
    </>
  );
};

export { RelationshipCards };
