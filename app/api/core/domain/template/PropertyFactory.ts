import { Context, Property } from '#api/core/domain/template/Property.js';
import {
  V1RelationshipProperty,
  V1RelationshipPropertyProps,
} from '#api/core/domain/template/V1RelationshipProperty.js';
import { UnhandledPropertyTypeError } from './errors.js';
import { TextProperty, TextPropertyProps } from './TextProperty.js';
import { NumericProperty, NumericPropertyProps } from './NumericProperty.js';
import { PreviewProperty, PreviewPropertyProps } from './PreviewProperty.js';
import { MultiDateProperty, MultiDatePropertyProps } from './MultiDateProperty.js';
import { MultiDateRangeProperty, MultiDateRangePropertyProps } from './MultiDateRangeProperty.js';
import { MediaProperty, MediaPropertyProps } from './MediaProperty.js';
import { MarkdownProperty, MarkdownPropertyProps } from './MarkdownProperty.js';
import { LinkProperty, LinkPropertyProps } from './LinkProperty.js';
import { ImageProperty, ImagePropertyProps } from './ImageProperty.js';
import { GeolocationProperty, GeolocationPropertyProps } from './GeoLocationProperty.js';
import { DateRangeProperty, DateRangePropertyProps } from './DateRangeProperty.js';
import { DateProperty, DatePropertyProps } from './DateProperty.js';
import { GenerateIdProperty, GenerateIdPropertyProps } from './GenerateIdProperty.js';
import { SelectProperty, SelectPropertyProps } from './select/SelectProperty.js';
import { MultiSelectProperty, MultiSelectPropertyProps } from './select/MultiSelectProperty.js';
import { NestedProperty, NestedPropertyProps } from './NestedProperty.js';
import { RelationshipPropertyProps } from './RelationshipProperty.js';

type CreateInput =
  | TextPropertyProps
  | NumericPropertyProps
  | PreviewPropertyProps
  | MultiDatePropertyProps
  | MultiDateRangePropertyProps
  | MarkdownPropertyProps
  | LinkPropertyProps
  | GeolocationPropertyProps
  | DateRangePropertyProps
  | DatePropertyProps
  | GenerateIdPropertyProps
  | SelectPropertyProps
  | MultiSelectPropertyProps
  | V1RelationshipPropertyProps
  | NestedPropertyProps
  | ImagePropertyProps
  | MediaPropertyProps
  | RelationshipPropertyProps;

class PropertyFactory {
  static create(input: CreateInput, context: Context): Property {
    switch (input.type) {
      case 'text':
        return new TextProperty(input, context);

      case 'numeric':
        return new NumericProperty(input, context);

      case 'preview':
        return new PreviewProperty(input, context);

      case 'multidate':
        return new MultiDateProperty(input, context);

      case 'multidaterange':
        return new MultiDateRangeProperty(input, context);

      case 'media':
        return new MediaProperty(input, context);

      case 'markdown':
        return new MarkdownProperty(input, context);

      case 'link':
        return new LinkProperty(input, context);

      case 'image':
        return new ImageProperty(input, context);

      case 'geolocation':
        return new GeolocationProperty(input, context);

      case 'daterange':
        return new DateRangeProperty(input, context);

      case 'date':
        return new DateProperty(input, context);

      case 'generatedid':
        return new GenerateIdProperty(input, context);

      case 'select':
        return new SelectProperty(input, context);

      case 'multiselect':
        return new MultiSelectProperty(input, context);

      case 'relationship':
        return V1RelationshipProperty.create(input, context);

      case 'nested':
        return new NestedProperty(input);

      default:
        throw new UnhandledPropertyTypeError(input.type || 'undefined');
    }
  }
}

export { PropertyFactory };
export type { CreateInput as PropertyFactoryCreateInput };
