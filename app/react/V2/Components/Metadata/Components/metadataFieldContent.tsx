import React, { ReactNode } from 'react';
import { Date } from './Date.js';
import { SimpleValue } from './SimpleValue.js';
import { Select } from './Select.js';
import { Geolocation } from './Geolocation.js';
import { Markdown } from './Markdown.js';
import { LinkProperty } from './LinkProperty.js';
import { Image } from './Image.js';
import { Media } from './Media.js';
import type { MetadataProperty } from '#V2/formatters/types.js';

const renderScalarContent = (data: MetadataProperty, long = false): ReactNode => {
  if (data.type === 'text' || data.type === 'generatedid' || data.type === 'numeric') {
    return <SimpleValue values={data.values} long={long} />;
  }
  if (
    data.type === 'date' ||
    data.type === 'daterange' ||
    data.type === 'multidate' ||
    data.type === 'multidaterange'
  ) {
    return <Date values={data.values} />;
  }
  if (data.type === 'select' || data.type === 'multiselect') {
    return <Select values={data} />;
  }
  if (data.type === 'link') {
    return <LinkProperty values={data.values} />;
  }
  return null;
};

const renderSpecializedContent = (data: MetadataProperty): ReactNode => {
  if (data.type === 'geolocation') {
    return <Geolocation markers={data.values} />;
  }
  if (data.type === 'markdown') {
    return <Markdown values={data.values} />;
  }
  if (data.type === 'media') {
    return <Media values={data.values} />;
  }
  if (data.type === 'image' || data.type === 'preview') {
    return <Image values={data.values} imageStyle={data.style} />;
  }
  return null;
};

const renderFieldContent = (data: MetadataProperty, long = false): ReactNode =>
  renderSpecializedContent(data) ?? renderScalarContent(data, long);

export { renderScalarContent, renderSpecializedContent, renderFieldContent };
