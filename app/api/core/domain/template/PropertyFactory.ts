import { Context, Property } from 'api/templates.v2/model/Property';
import { TextProperty, TextPropertyProps } from './TextProperty';
import { NumericProperty, NumericPropertyProps } from './NumericProperty';
import { PreviewProperty, PreviewPropertyProps } from './PreviewProperty';
import { MultiDateProperty, MultiDatePropertyProps } from './MultiDateProperty';
import { MultiDateRangeProperty, MultiDateRangePropertyProps } from './MultiDateRangeProperty';
import { MediaProperty } from './MediaProperty';
import { AbstractImagePropertyProps } from './AbstractImageProperty';
import { MarkdownProperty, MarkdownPropertyProps } from './MarkdownProperty';
import { LinkProperty, LinkPropertyProps } from './LinkProperty';
import { ImageProperty } from './ImageProperty';
import { GeolocationProperty, GeolocationPropertyProps } from './GeoLocationProperty';
import { DateRangeProperty, DateRangePropertyProps } from './DateRangeProperty';
import { DateProperty, DatePropertyProps } from './DateProperty';
import { GenerateIdProperty, GenerateIdPropertyProps } from './GenerateIdProperty';
import { SelectProperty, SelectPropertyProps } from './SelectProperty';
import { MultiSelectProperty, MultiSelectPropertyProps } from './MultiSelectProperty';

type CreateInput =
  | TextPropertyProps
  | NumericPropertyProps
  | PreviewPropertyProps
  | MultiDatePropertyProps
  | MultiDateRangePropertyProps
  | AbstractImagePropertyProps
  | MarkdownPropertyProps
  | LinkPropertyProps
  | GeolocationPropertyProps
  | DateRangePropertyProps
  | DatePropertyProps
  | GenerateIdPropertyProps
  | SelectPropertyProps
  | MultiSelectPropertyProps;

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
        return new SelectProperty(input as SelectPropertyProps, context);

      case 'multiselect':
        return new MultiSelectProperty(input as MultiSelectPropertyProps, context);

      default:
        throw new Error(`The following type was not handled. Type = ${input.type}`);
    }
  }
}

export { PropertyFactory };
export type { CreateInput as PropertyFactoryCreateInput };
