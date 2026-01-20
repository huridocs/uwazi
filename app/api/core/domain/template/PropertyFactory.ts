import { Context, Property } from '#api/core/domain/template/Property.js';
import {
  V1RelationshipProperty,
  V1RelationshipPropertyProps,
} from '#api/core/domain/template/V1RelationshipProperty.js';
import { TextProperty, TextPropertyProps } from '#api/core/domain/template/TextProperty.js';
import { NumericProperty, NumericPropertyProps } from '#api/core/domain/template/NumericProperty.js';
import { PreviewProperty, PreviewPropertyProps } from '#api/core/domain/template/PreviewProperty.js';
import { MultiDateProperty, MultiDatePropertyProps } from '#api/core/domain/template/MultiDateProperty.js';
import { MultiDateRangeProperty, MultiDateRangePropertyProps } from '#api/core/domain/template/MultiDateRangeProperty.js';
import { MediaProperty, MediaPropertyProps } from '#api/core/domain/template/MediaProperty.js';
import { MarkdownProperty, MarkdownPropertyProps } from '#api/core/domain/template/MarkdownProperty.js';
import { LinkProperty, LinkPropertyProps } from '#api/core/domain/template/LinkProperty.js';
import { ImageProperty, ImagePropertyProps } from '#api/core/domain/template/ImageProperty.js';
import { GeolocationProperty, GeolocationPropertyProps } from '#api/core/domain/template/GeoLocationProperty.js';
import { DateRangeProperty, DateRangePropertyProps } from '#api/core/domain/template/DateRangeProperty.js';
import { DateProperty, DatePropertyProps } from '#api/core/domain/template/DateProperty.js';
import { GenerateIdProperty, GenerateIdPropertyProps } from '#api/core/domain/template/GenerateIdProperty.js';
import { SelectProperty, SelectPropertyProps } from '#api/core/domain/template/select/SelectProperty.js';
import { MultiSelectProperty, MultiSelectPropertyProps } from '#api/core/domain/template/select/MultiSelectProperty.js';
import { NestedProperty, NestedPropertyProps } from '#api/core/domain/template/NestedProperty.js';
import { RelationshipPropertyProps } from '#api/core/domain/template/RelationshipProperty.js';

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
