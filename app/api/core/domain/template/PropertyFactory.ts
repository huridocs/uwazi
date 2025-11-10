import { Context, Property } from 'api/core/domain/template/Property';
import {
  V1RelationshipProperty,
  V1RelationshipPropertyProps,
} from 'api/core/domain/template/V1RelationshipProperty';
import { TextProperty, TextPropertyProps } from './TextProperty';
import { NumericProperty, NumericPropertyProps } from './NumericProperty';
import { PreviewProperty, PreviewPropertyProps } from './PreviewProperty';
import { MultiDateProperty, MultiDatePropertyProps } from './MultiDateProperty';
import { MultiDateRangeProperty, MultiDateRangePropertyProps } from './MultiDateRangeProperty';
import { MediaProperty, MediaPropertyProps } from './MediaProperty';
import { MarkdownProperty, MarkdownPropertyProps } from './MarkdownProperty';
import { LinkProperty, LinkPropertyProps } from './LinkProperty';
import { ImageProperty, ImagePropertyProps } from './ImageProperty';
import { GeolocationProperty, GeolocationPropertyProps } from './GeoLocationProperty';
import { DateRangeProperty, DateRangePropertyProps } from './DateRangeProperty';
import { DateProperty, DatePropertyProps } from './DateProperty';
import { GenerateIdProperty, GenerateIdPropertyProps } from './GenerateIdProperty';
import { SelectProperty, SelectPropertyProps } from './select/SelectProperty';
import { MultiSelectProperty, MultiSelectPropertyProps } from './select/MultiSelectProperty';
import { NestedProperty, NestedPropertyProps } from './NestedProperty';
import { RelationshipPropertyProps } from './RelationshipProperty';

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
        throw new Error(`The following type was not handled. Type = ${input.type}`);
    }
  }
}

export { PropertyFactory };
export type { CreateInput as PropertyFactoryCreateInput };
