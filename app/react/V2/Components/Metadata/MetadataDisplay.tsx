import React, { useCallback, useMemo } from 'react';
import { useAtomValue } from 'jotai';
import { Translate } from '#app/I18N/index.js';
import { templatesAtom } from '#V2/atoms/templatesAtom.js';
import { Entity } from '#V2/api/entities/types.js';
import { Date, RelationshipCards, PropertyValue, MasonryPropertyCard } from './Components/index.js';
import type { MetadataProperty, RelationshipMetadataProperty } from '#V2/formatters/types.js';
import { useFormatMetadata } from './hooks/useFormatMetadata.js';
import { buildTemplatePropertyById } from './buildTemplatePropertyById.js';
import { renderMasonryField } from './Components/renderMasonryField.js';

type MetadataDisplayProps = {
  entity: Entity;
};

const isRelationshipProperty = (data: MetadataProperty): data is RelationshipMetadataProperty =>
  data.type === 'relationship';

const MetadataDisplay = ({ entity }: MetadataDisplayProps) => {
  const templates = useAtomValue(templatesAtom);

  const { entityTemplate, metadata } = useFormatMetadata(entity, templates, {
    groupGeolocationProperties: true,
  });

  const templatePropertyById = useMemo(
    () => buildTemplatePropertyById(entityTemplate?.properties),
    [entityTemplate?.properties]
  );

  const { relationshipFields, otherFields } = useMemo(() => {
    const relationships: RelationshipMetadataProperty[] = [];
    const others: MetadataProperty[] = [];
    metadata.forEach(field => {
      if (isRelationshipProperty(field)) {
        relationships.push(field);
      } else {
        others.push(field);
      }
    });
    return { relationshipFields: relationships, otherFields: others };
  }, [metadata]);

  const renderMetadataFields = useCallback(
    (fields: MetadataProperty[]) => {
      const translationContext = entityTemplate?._id || '';
      return fields.map(data =>
        renderMasonryField(data, translationContext, templatePropertyById.get(data._id))
      );
    },
    [entityTemplate?._id, templatePropertyById]
  );

  if (!entity || !entityTemplate) {
    return <Translate>NO DATA AVAILABLE</Translate>;
  }

  const translationContext = entityTemplate._id || '';

  return (
    <div data-testid="metadata-display">
      <dl className="flex min-w-0 flex-wrap gap-3">
        {typeof entity.creationDate === 'number' && (
          <MasonryPropertyCard label="Creation Date" translationContext="System">
            <PropertyValue as="dd" className="flex flex-col gap-1">
              <Date values={[{ value: entity.creationDate }]} />
            </PropertyValue>
          </MasonryPropertyCard>
        )}

        {typeof entity.editDate === 'number' && (
          <MasonryPropertyCard label="Edit Date" translationContext="System">
            <PropertyValue as="dd" className="flex flex-col gap-1">
              <Date values={[{ value: entity.editDate }]} />
            </PropertyValue>
          </MasonryPropertyCard>
        )}

        {renderMetadataFields(otherFields)}
      </dl>
      <RelationshipCards
        fields={relationshipFields}
        translationContext={translationContext}
        templatePropertyById={templatePropertyById}
        masonry
      />
    </div>
  );
};

export { MetadataDisplay };
