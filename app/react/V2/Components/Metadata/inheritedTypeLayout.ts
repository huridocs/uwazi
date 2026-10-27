import type { FieldContentOptions } from './Components/metadataFieldContent.js';

type InheritedTypeLayout = {
  density?: FieldContentOptions['density'];
  minWidthClass: string;
};

const inheritedTypeLayout = (inheritedType?: string): InheritedTypeLayout => {
  switch (inheritedType) {
    case 'geolocation':
      return { density: 'compact', minWidthClass: 'min-w-72' };
    case 'media':
      return { density: 'compact', minWidthClass: 'min-w-64' };
    case 'image':
    case 'preview':
      return { density: 'compact', minWidthClass: 'min-w-48' };
    default:
      return { minWidthClass: 'min-w-0' };
  }
};

const propertyRowTracks = (columns: { inheritedType?: string }[]) => {
  const tracks = columns.map(column =>
    column.inheritedType === 'markdown' ? 'minmax(0, 3fr)' : 'minmax(0, 1fr)'
  );
  if (!tracks.includes('minmax(0, 3fr)')) {
    return `repeat(${columns.length + 1}, minmax(0, 1fr))`;
  }
  return ['minmax(0, max-content)', ...tracks].join(' ');
};

export { inheritedTypeLayout, propertyRowTracks };
