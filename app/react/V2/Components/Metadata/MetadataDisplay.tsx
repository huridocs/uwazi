import React, { useCallback, useMemo, ReactNode } from 'react';
import { useAtomValue } from 'jotai';
import { Translate } from '#app/I18N/index.js';
import { templatesAtom } from '#V2/atoms/templatesAtom.js';
import { Entity } from '#V2/api/entities/types.js';
import { Date, PropertyValue, MasonryPropertyCard } from './Components/index.js';
import { buildRelationshipCardNodes } from './Components/RelationshipCards.js';
import { renderFieldContent } from './Components/metadataFieldContent.js';
import {
  groupedGeolocationTitleNode,
  isGroupedGeolocation,
} from './Components/metadataFieldTitle.js';
import type { MetadataProperty, RelationshipMetadataProperty } from '#V2/formatters/types.js';
import type { ClientProperty } from '#V2/shared/types.js';
import { useFormatMetadata } from './hooks/useFormatMetadata.js';
import { buildTemplatePropertyById } from './buildTemplatePropertyById.js';
import {
  FULL_ROW_METADATA_FIELD_LAYOUT,
  isRelationshipProperty,
  metadataGridClassForProperty,
} from './metadataPropertyLayout.js';

type MetadataDisplayProps = {
  entity: Entity;
};

const PROPERTY_VALUE_TYPES: ReadonlySet<MetadataProperty['type']> = new Set([
  'text',
  'generatedid',
  'numeric',
  'date',
  'daterange',
  'multidate',
  'multidaterange',
  'select',
  'multiselect',
  'link',
]);

const propertyValueClassName = (type: MetadataProperty['type']): string | undefined => {
  if (
    type === 'date' ||
    type === 'daterange' ||
    type === 'multidate' ||
    type === 'multidaterange'
  ) {
    return 'flex flex-col gap-1';
  }
  if (type === 'link') {
    return 'underline';
  }
  return undefined;
};

const renderMasonryField = (
  data: MetadataProperty,
  translationContext: string,
  templateProperty: ClientProperty | undefined
): ReactNode => {
  const content = renderFieldContent(data);
  if (!content) {
    return undefined;
  }

  const className = metadataGridClassForProperty(data, templateProperty);
  const isGeoGroup = isGroupedGeolocation(data);
  const hideLabel = isGeoGroup ? false : data.hideLabel;
  const labelNode = isGeoGroup
    ? groupedGeolocationTitleNode(
        data.hideLabel,
        'text-xs font-semibold uppercase tracking-wide text-ink-tertiary'
      )
    : undefined;

  if (PROPERTY_VALUE_TYPES.has(data.type)) {
    return (
      <MasonryPropertyCard
        key={data._id}
        label={data.label}
        translationContext={translationContext}
        hideLabel={hideLabel}
        className={className}
        labelNode={labelNode}
      >
        <PropertyValue as="dd" className={propertyValueClassName(data.type)}>
          {content}
        </PropertyValue>
      </MasonryPropertyCard>
    );
  }

  return (
    <MasonryPropertyCard
      key={data._id}
      label={data.label}
      translationContext={translationContext}
      hideLabel={hideLabel}
      className={className}
      labelNode={labelNode}
    >
      <dd>{content}</dd>
    </MasonryPropertyCard>
  );
};

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

  const translationContext = entityTemplate?._id || '';

  const relationshipNodes = useMemo(
    () =>
      buildRelationshipCardNodes({
        fields: relationshipFields,
        translationContext,
        templatePropertyById,
        relationshipClassName: FULL_ROW_METADATA_FIELD_LAYOUT,
      }),
    [relationshipFields, templatePropertyById, translationContext]
  );

  const renderMetadataFields = useCallback(
    (fields: MetadataProperty[]) =>
      fields.map(data =>
        renderMasonryField(data, translationContext, templatePropertyById.get(data._id))
      ),
    [templatePropertyById, translationContext]
  );

  if (!entity || !entityTemplate) {
    return <Translate>NO DATA AVAILABLE</Translate>;
  }

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
      {relationshipNodes.length > 0 ? (
        <>
          <div className="mt-2 flex w-full min-w-0 basis-full items-center">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-tertiary">
              <Translate>Relationships</Translate>
            </p>
          </div>
          <dl className="flex min-w-0 flex-wrap gap-3">{relationshipNodes}</dl>
        </>
      ) : null}
    </div>
  );
};

export { MetadataDisplay };
