import { getMimetypeFromUrl } from '#V2/shared/formatHelpers.js';
import type { Entity } from '#V2/api/entities/types.js';
import type { ClientTemplateSchema } from '#V2/shared/types.js';
import type { BaseMetadataProperty, MediaMetadataProperty, Timelink } from '../types';
import { imageLayoutFromTemplate } from './formatImageProperty.js';
import {
  resolvePropertyMetadataValues,
  resolvePropertyType,
} from './resolvePropertyMetadataValues.js';

const isMediaType = (type: BaseMetadataProperty['type']) => type === 'media';

const processTimelines = (timelines: { [key: string]: string }): Timelink[] =>
  Object.entries(timelines).map(([time, label]) => {
    const [hours, minutes, seconds] = time.split(':').map(Number);
    return {
      label,
      hh: hours,
      mm: minutes,
      ss: seconds,
      time: hours * 3600 + minutes * 60 + seconds,
    };
  });

const getFileType = (mimetype: string): string => {
  if (!mimetype) return 'unknown';

  const [type] = mimetype.split('/');
  return type === 'application' ? 'document' : type;
};

const formatMediaProperty = (
  property: BaseMetadataProperty,
  metadata?: Entity['metadata'],
  template?: ClientTemplateSchema
): MediaMetadataProperty | null => {
  const metadataValues = resolvePropertyMetadataValues(property, metadata);
  const type = resolvePropertyType(property, metadata);

  if (!isMediaType(type)) {
    return null;
  }

  const { style, fullWidth } = imageLayoutFromTemplate(property, template);

  const formattedProperty: MediaMetadataProperty = {
    _id: property._id,
    name: property.name,
    type: 'media',
    values: [],
    label: property.label,
    inherited: property.inherited,
    inheritedType: property.inheritedType,
    style,
    fullWidth,
  };

  // eslint-disable-next-line max-statements
  metadataValues.forEach(item => {
    const value = item?.value as string | undefined;

    if (!value) {
      return;
    }

    if (typeof value === 'string' && value.startsWith('(')) {
      const match = value.match(/^\(([^,]+),\s*({.*})\)$/);

      if (match) {
        const [, fileUrl, timelinksJson] = match;
        const timelinksData = JSON.parse(timelinksJson);
        const timelinks = processTimelines(timelinksData.timelinks);
        const fileName = fileUrl.split('/').pop() || 'Unknown file';
        const mimetype = getMimetypeFromUrl(fileUrl);

        formattedProperty.values.push({
          value: fileUrl,
          alt: fileName,
          mimetype,
          fileType: getFileType(mimetype),
          timelinks,
        });

        return;
      }
    }

    formattedProperty.values.push({
      value,
      timelinks: [],
    });
  });

  return formattedProperty;
};

export { formatMediaProperty };
