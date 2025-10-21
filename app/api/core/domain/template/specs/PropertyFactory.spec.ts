import { DateProperty } from '../DateProperty';
import { DateRangeProperty } from '../DateRangeProperty';
import { GenerateIdProperty } from '../GenerateIdProperty';
import { GeolocationProperty } from '../GeoLocationProperty';
import { ImageProperty } from '../ImageProperty';
import { LinkProperty } from '../LinkProperty';
import { MarkdownProperty } from '../MarkdownProperty';
import { MediaProperty } from '../MediaProperty';
import { MultiDateProperty } from '../MultiDateProperty';
import { MultiDateRangeProperty } from '../MultiDateRangeProperty';
import { MultiSelectProperty } from '../MultiSelectProperty';
import { NumericProperty } from '../NumericProperty';
import { PreviewProperty } from '../PreviewProperty';
import { PropertyFactory } from '../PropertyFactory';
import { PropertyTypeEnum } from '../PropertyType';
import { SelectProperty } from '../SelectProperty';
import { TextProperty } from '../TextProperty';

describe('PropertyFactory', () => {
  it('should create an instance of TextProperty', () => {
    expect(
      PropertyFactory.create(
        {
          template: 'any',
          id: 'any_id',
          label: 'A text property',
          type: PropertyTypeEnum.Text,
        },
        {}
      )
    ).toBeInstanceOf(TextProperty);
  });

  it('should create an instance of NumericProperty', () => {
    expect(
      PropertyFactory.create(
        {
          template: 'any',
          id: 'any_id',
          label: 'A numeric property',
          type: PropertyTypeEnum.Numeric,
        },
        {}
      )
    ).toBeInstanceOf(NumericProperty);
  });

  it('should create an instance of PreviewProperty', () => {
    expect(
      PropertyFactory.create(
        {
          template: 'any',
          id: 'any_id',
          label: 'A numeric property',
          type: PropertyTypeEnum.Preview,
        },
        {}
      )
    ).toBeInstanceOf(PreviewProperty);
  });

  it('should create an instance of MultiDateProperty', () => {
    expect(
      PropertyFactory.create(
        {
          template: 'any',
          id: 'any_id',
          label: 'A numeric property',
          type: PropertyTypeEnum.MultiDate,
        },
        {}
      )
    ).toBeInstanceOf(MultiDateProperty);
  });

  it('should create an instance of MultiDateRangeProperty', () => {
    expect(
      PropertyFactory.create(
        {
          template: 'any',
          id: 'any_id',
          label: 'A numeric property',
          type: PropertyTypeEnum.MultiDateRange,
        },
        {}
      )
    ).toBeInstanceOf(MultiDateRangeProperty);
  });

  it('should create an instance of MediaProperty', () => {
    expect(
      PropertyFactory.create(
        {
          template: 'any',
          id: 'any_id',
          label: 'A numeric property',
          type: PropertyTypeEnum.Media,
        },
        {}
      )
    ).toBeInstanceOf(MediaProperty);
  });

  it('should create an instance of MarkdownProperty', () => {
    expect(
      PropertyFactory.create(
        {
          template: 'any',
          id: 'any_id',
          label: 'A numeric property',
          type: PropertyTypeEnum.Markdown,
        },
        {}
      )
    ).toBeInstanceOf(MarkdownProperty);
  });

  it('should create an instance of LinkProperty', () => {
    expect(
      PropertyFactory.create(
        {
          template: 'any',
          id: 'any_id',
          label: 'A numeric property',
          type: PropertyTypeEnum.Link,
        },
        {}
      )
    ).toBeInstanceOf(LinkProperty);
  });

  it('should create an instance of ImageProperty', () => {
    expect(
      PropertyFactory.create(
        {
          template: 'any',
          id: 'any_id',
          label: 'A numeric property',
          type: PropertyTypeEnum.Image,
        },
        {}
      )
    ).toBeInstanceOf(ImageProperty);
  });

  it('should create an instance of GeolocationProperty', () => {
    expect(
      PropertyFactory.create(
        {
          template: 'any',
          id: 'any_id',
          label: 'A numeric property',
          type: PropertyTypeEnum.Geolocation,
        },
        {}
      )
    ).toBeInstanceOf(GeolocationProperty);
  });

  it('should create an instance of DateRangeProperty', () => {
    expect(
      PropertyFactory.create(
        {
          template: 'any',
          id: 'any_id',
          label: 'A numeric property',
          type: PropertyTypeEnum.DateRange,
        },
        {}
      )
    ).toBeInstanceOf(DateRangeProperty);
  });

  it('should create an instance of DateProperty', () => {
    expect(
      PropertyFactory.create(
        {
          template: 'any',
          id: 'any_id',
          label: 'A numeric property',
          type: PropertyTypeEnum.Date,
        },
        {}
      )
    ).toBeInstanceOf(DateProperty);
  });

  it('should create an instance of GenerateIdProperty', () => {
    expect(
      PropertyFactory.create(
        {
          template: 'any',
          id: 'any_id',
          label: 'A numeric property',
          type: PropertyTypeEnum.GeneratedId,
        },
        {}
      )
    ).toBeInstanceOf(GenerateIdProperty);
  });

  it('should create an instance of SelectProperty', () => {
    expect(
      PropertyFactory.create(
        {
          template: 'any',
          id: 'any_id',
          label: 'A numeric property',
          type: PropertyTypeEnum.Select,
          content: 'any',
        },
        {}
      )
    ).toBeInstanceOf(SelectProperty);
  });

  it('should create an instance of MultiSelectProperty', () => {
    expect(
      PropertyFactory.create(
        {
          template: 'any',
          id: 'any_id',
          label: 'A numeric property',
          type: PropertyTypeEnum.MultiSelect,
          content: 'any',
        },
        {}
      )
    ).toBeInstanceOf(MultiSelectProperty);
  });
});
