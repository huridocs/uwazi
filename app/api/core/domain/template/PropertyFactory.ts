import { Property } from 'api/templates.v2/model/Property';
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
  | DatePropertyProps;

class PropertyFactory {
  static create(input: CreateInput): Property {
    switch (input.type) {
      case 'text':
        return new TextProperty(input);

      case 'numeric':
        return new NumericProperty(input);

      case 'preview':
        return new PreviewProperty(input);

      case 'multidate':
        return new MultiDateProperty(input);

      case 'multidaterange':
        return new MultiDateRangeProperty(input);

      case 'media':
        return new MediaProperty(input);

      case 'markdown':
        return new MarkdownProperty(input);

      case 'link':
        return new LinkProperty(input);

      case 'image':
        return new ImageProperty(input);

      case 'geolocation':
        return new GeolocationProperty(input);

      case 'daterange':
        return new DateRangeProperty(input);

      case 'date':
        return new DateProperty(input);

      default:
        throw new Error(`The following type was not handled. Type = ${input.type}`);
    }
  }
}

export { PropertyFactory };
