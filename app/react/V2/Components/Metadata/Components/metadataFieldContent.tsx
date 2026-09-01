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
import type { MetadataProperty } from '#V2/formatters/types.js';

type FieldContentOptions = {
  density?: 'default' | 'compact';
  long?: boolean;
};

const hasFilledText = (values?: Array<{ value?: string | null }>) =>
  Boolean(values?.some(value => value.value !== '' && value.value != null));

const renderScalarContent = (data: MetadataProperty, long = false): ReactNode => {
  if (data.type === 'text' || data.type === 'generatedid' || data.type === 'numeric') {
    if (!hasFilledText(data.values)) return null;
    return <SimpleValue values={data.values} long={long} />;
  }
  if (
    data.type === 'date' ||
    data.type === 'daterange' ||
    data.type === 'multidate' ||
    data.type === 'multidaterange'
  ) {
    if (!data.values?.length) return null;
    return <Date values={data.values} />;
  }
  if (data.type === 'select' || data.type === 'multiselect') {
    if (!data.values?.length) return null;
    return <Select values={data} />;
  }
  if (data.type === 'link') {
    if (!hasFilledText(data.values)) return null;
    return <LinkProperty values={data.values} />;
  }
  return null;
};

const renderSpecializedContent = (
  data: MetadataProperty,
  options: FieldContentOptions = {}
): ReactNode => {
  const compact = (options.density ?? 'default') === 'compact';

  if (data.type === 'relationship') {
    return connectionPillsForField(data, undefined);
  }
  if (data.type === 'geolocation') {
    if (!data.values?.length) return null;
    return (
      <Geolocation
        markers={data.values}
        height={compact ? 160 : undefined}
        showControls={compact ? false : undefined}
      />
    );
  }
  if (data.type === 'markdown') {
    if (!hasFilledText(data.values)) return null;
    return <Markdown values={data.values} />;
  }
  if (data.type === 'media') {
    if (!hasFilledText(data.values)) return null;
    return <Media values={data.values} height={compact ? 140 : undefined} />;
  }
  if (data.type === 'image' || data.type === 'preview') {
    if (!hasFilledText(data.values)) return null;
    return (
      <Image values={data.values} imageStyle={data.style} density={options.density ?? 'default'} />
    );
  }
  return null;
};

const renderFieldContent = (data: MetadataProperty, options: FieldContentOptions = {}): ReactNode =>
  renderSpecializedContent(data, options) ?? renderScalarContent(data, options.long ?? false);

export type { FieldContentOptions };
export { renderScalarContent, renderSpecializedContent, renderFieldContent };
