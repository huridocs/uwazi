import { getMimetypeFromUrl } from '#V2/shared/formatHelpers.js';
import type { Entity } from '#V2/api/entities/types.js';
import type {
  BaseMetadataProperty,
  MediaMetadataProperty,
  Timelink,
} from '../MetadataPropertiesType';

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

// eslint-disable-next-line max-statements
const formatMediaProperty = (
  property: BaseMetadataProperty,
  metadata?: Entity['metadata']
): MediaMetadataProperty | null => {
  if (!isMediaType(property.type)) {
    return null;
  }

  const value = metadata?.[property.name]?.[0].value as string;

  const formattedProperty: MediaMetadataProperty = {
    _id: property._id,
    name: property.name,
    type: property.type,
    values: [],
    label: property.label,
    inherited: property.inherited,
    inheritedType: property.inheritedType,
  };

  if (typeof value === 'string' && value.startsWith('(')) {
    const match = value.match(/^\(([^,]+),\s*({.*})\)$/);
    if (match) {
      const fileUrl = match[1];
      const timelinksData = JSON.parse(match[2]);
      const timelinks = processTimelines(timelinksData.timelinks);
      const fileName = fileUrl.split('/').pop() || 'Unknown file';
      const mimetype = getMimetypeFromUrl(fileUrl);
      formattedProperty.values.push({
        value: fileUrl,
        alt: fileName,
        mimetype,
        fileType: getFileType(mimetype),
        timelinks: timelinks || {},
      });
    }
  } else {
    formattedProperty.values.push({
      value: value?.toString() || '',
      timelinks: [],
    });
  }

  return formattedProperty;
};

export { formatMediaProperty };
