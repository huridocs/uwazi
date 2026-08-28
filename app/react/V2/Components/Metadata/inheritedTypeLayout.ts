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
      return { density: 'default', minWidthClass: 'min-w-48' };
    default:
      return { minWidthClass: 'min-w-0' };
  }
};

export { inheritedTypeLayout };
export type { InheritedTypeLayout };
