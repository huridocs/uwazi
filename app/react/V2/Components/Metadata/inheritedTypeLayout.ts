import type { FieldContentOptions } from './Components/metadataFieldContent.js';

type InheritedTypeLayout = {
  density?: FieldContentOptions['density'];
};

const inheritedTypeLayout = (inheritedType?: string): InheritedTypeLayout => {
  switch (inheritedType) {
    case 'geolocation':
    case 'media':
    case 'image':
    case 'preview':
      return { density: 'compact' };
    default:
      return {};
  }
};

export { inheritedTypeLayout };
