import React, { ReactNode } from 'react';
import { Translate } from '#app/I18N/index.js';
import { Date } from './Date.js';
import { SimpleValue } from './SimpleValue.js';
import { Select } from './Select.js';
import { Geolocation } from './Geolocation.js';
import { Markdown } from './Markdown.js';
import { LinkProperty } from './LinkProperty.js';
import { Image } from './Image.js';
import { Media } from './Media.js';
import { PropertyValue } from './PropertyValue.js';
import { MasonryPropertyCard } from './MasonryPropertyCard.js';
import type { MetadataProperty } from '#V2/formatters/types.js';
import type { ClientProperty } from '#V2/shared/types.js';
import { metadataGridClassForProperty } from '../metadataPropertyLayout.js';

const renderMasonryField = (
  data: MetadataProperty,
  translationContext: string,
  templateProperty: ClientProperty | undefined
): ReactNode => {
  const className = metadataGridClassForProperty(data, templateProperty);
  const shell = {
    label: data.label,
    translationContext,
    hideLabel: data.hideLabel,
    className,
  };

  if (data.type === 'text' || data.type === 'generatedid' || data.type === 'numeric') {
    return (
      <MasonryPropertyCard key={data._id} {...shell}>
        <PropertyValue as="dd">
          <SimpleValue values={data.values} />
        </PropertyValue>
      </MasonryPropertyCard>
    );
  }

  if (
    data.type === 'date' ||
    data.type === 'daterange' ||
    data.type === 'multidate' ||
    data.type === 'multidaterange'
  ) {
    return (
      <MasonryPropertyCard key={data._id} {...shell}>
        <PropertyValue as="dd" className="flex flex-col gap-1">
          <Date values={data.values} />
        </PropertyValue>
      </MasonryPropertyCard>
    );
  }

  if (data.type === 'geolocation') {
    const isGroup = Boolean(data.propertyGroup?.length);
    return (
      <MasonryPropertyCard
        key={data._id}
        {...shell}
        hideLabel={!isGroup && data.hideLabel}
        labelNode={
          isGroup ? (
            <Translate
              className={
                data.hideLabel
                  ? 'sr-only'
                  : 'text-xs font-semibold uppercase tracking-wide text-ink-tertiary'
              }
            >
              Grouped geolocation properties
            </Translate>
          ) : undefined
        }
      >
        <dd>
          <Geolocation markers={data.values} />
        </dd>
      </MasonryPropertyCard>
    );
  }

  if (data.type === 'select' || data.type === 'multiselect') {
    return (
      <MasonryPropertyCard key={data._id} {...shell}>
        <PropertyValue as="dd">
          <Select values={data} />
        </PropertyValue>
      </MasonryPropertyCard>
    );
  }

  if (data.type === 'markdown') {
    return (
      <MasonryPropertyCard key={data._id} {...shell}>
        <dd>
          <Markdown values={data.values} />
        </dd>
      </MasonryPropertyCard>
    );
  }

  if (data.type === 'link') {
    return (
      <MasonryPropertyCard key={data._id} {...shell}>
        <PropertyValue as="dd" className="underline">
          <LinkProperty values={data.values} />
        </PropertyValue>
      </MasonryPropertyCard>
    );
  }

  if (data.type === 'media') {
    return (
      <MasonryPropertyCard key={data._id} {...shell}>
        <dd>
          <Media values={data.values} />
        </dd>
      </MasonryPropertyCard>
    );
  }

  if (data.type === 'image' || data.type === 'preview') {
    return (
      <MasonryPropertyCard key={data._id} {...shell}>
        <dd>
          <Image values={data.values} imageStyle={data.style} />
        </dd>
      </MasonryPropertyCard>
    );
  }

  return undefined;
};

export { renderMasonryField };
