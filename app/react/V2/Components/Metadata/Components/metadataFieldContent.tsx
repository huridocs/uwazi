import React, { ReactNode } from 'react';
import { Date } from './Date.js';
import { SimpleValue } from './SimpleValue.js';
import { Select } from './Select.js';
import { Geolocation } from './Geolocation.js';
import { Markdown } from './Markdown.js';
import { LinkProperty } from './LinkProperty.js';
import { Image } from './Image.js';
import { Media } from './Media.js';
import { connectionPillsForField } from './ConnectionPills.js';
import type { OpenEntityTarget } from './ConnectionPills.js';
import type { MetadataProperty } from '#V2/formatters/types.js';

type FieldContentOptions = {
  density?: 'default' | 'compact';
  long?: boolean;
  onOpenEntity?: (target: OpenEntityTarget) => void;
};

const hasFilledText = (values?: Array<{ value?: string | null }>) =>
  Boolean(values?.some(value => value.value !== '' && value.value != null));

const renderScalarContent = (data: MetadataProperty, long = false): ReactNode => {
  if (data.type === 'text' || data.type === 'generatedid' || data.type === 'numeric') {
    return hasFilledText(data.values) ? <SimpleValue values={data.values} long={long} /> : null;
  }
  if (
    data.type === 'date' ||
    data.type === 'daterange' ||
    data.type === 'multidate' ||
    data.type === 'multidaterange'
  ) {
    return data.values?.length ? <Date values={data.values} /> : null;
  }
  if (data.type === 'select' || data.type === 'multiselect') {
    return data.values?.length ? <Select values={data} /> : null;
  }
  if (data.type === 'link') {
    return hasFilledText(data.values) ? <LinkProperty values={data.values} /> : null;
  }
  return null;
};

const renderMediaOrImage = (
  data: MetadataProperty,
  compact: boolean,
  density: FieldContentOptions['density']
): ReactNode => {
  if (data.type === 'media') {
    return hasFilledText(data.values) ? (
      <Media
        values={data.values}
        height={compact ? 140 : '100%'}
        frame={compact ? 'natural' : 'video'}
      />
    ) : null;
  }
  if (data.type === 'image' || data.type === 'preview') {
    return hasFilledText(data.values) ? (
      <Image
        values={data.values}
        imageStyle={data.style}
        density={density ?? 'default'}
        frame={compact ? 'natural' : 'video'}
      />
    ) : null;
  }
  return null;
};

const renderSpecializedContent = (
  data: MetadataProperty,
  options: FieldContentOptions = {}
): ReactNode => {
  const compact = (options.density ?? 'default') === 'compact';
  if (data.type === 'relationship') {
    return connectionPillsForField(data, undefined, { onOpenEntity: options.onOpenEntity });
  }
  if (data.type === 'geolocation') {
    return data.values?.length ? (
      <Geolocation
        markers={data.values}
        height={compact ? 160 : undefined}
        showControls={compact ? false : undefined}
        showLegend={!compact && (data.propertyGroup?.length ?? 0) > 1}
        onOpenEntity={options.onOpenEntity}
      />
    ) : null;
  }
  if (data.type === 'markdown') {
    return hasFilledText(data.values) ? <Markdown values={data.values} /> : null;
  }
  return renderMediaOrImage(data, compact, options.density);
};

const renderFieldContent = (data: MetadataProperty, options: FieldContentOptions = {}): ReactNode =>
  renderSpecializedContent(data, options) ?? renderScalarContent(data, options.long ?? false);

export type { FieldContentOptions };
export { renderScalarContent, renderSpecializedContent, renderFieldContent };
