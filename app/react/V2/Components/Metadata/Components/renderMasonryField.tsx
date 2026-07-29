import React, { ReactNode } from 'react';
import { Translate } from '#app/I18N/index.js';
import { PropertyValue } from './PropertyValue.js';
import { MasonryPropertyCard } from './MasonryPropertyCard.js';
import { renderFieldContent } from './metadataFieldContent.js';
import type { MetadataProperty } from '#V2/formatters/types.js';
import type { ClientProperty } from '#V2/shared/types.js';
import { metadataGridClassForProperty } from '../metadataPropertyLayout.js';

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
  const isGeoGroup = data.type === 'geolocation' && Boolean(data.propertyGroup?.length);
  const shell = {
    label: data.label,
    translationContext,
    hideLabel: isGeoGroup ? false : data.hideLabel,
    className,
    labelNode: isGeoGroup ? (
      <Translate
        className={
          data.hideLabel
            ? 'sr-only'
            : 'text-xs font-semibold uppercase tracking-wide text-ink-tertiary'
        }
      >
        Grouped geolocation properties
      </Translate>
    ) : undefined,
  };

  if (PROPERTY_VALUE_TYPES.has(data.type)) {
    return (
      <MasonryPropertyCard key={data._id} {...shell}>
        <PropertyValue as="dd" className={propertyValueClassName(data.type)}>
          {content}
        </PropertyValue>
      </MasonryPropertyCard>
    );
  }

  return (
    <MasonryPropertyCard key={data._id} {...shell}>
      <dd>{content}</dd>
    </MasonryPropertyCard>
  );
};

export { renderMasonryField };
