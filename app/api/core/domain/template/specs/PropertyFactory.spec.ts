import { DateProperty } from '#api/core/domain/template/DateProperty.js';
import { DateRangeProperty } from '#api/core/domain/template/DateRangeProperty.js';
import { GenerateIdProperty } from '#api/core/domain/template/GenerateIdProperty.js';
import { GeolocationProperty } from '#api/core/domain/template/GeoLocationProperty.js';
import { ImageProperty } from '#api/core/domain/template/ImageProperty.js';
import { LinkProperty } from '#api/core/domain/template/LinkProperty.js';
import { MarkdownProperty } from '#api/core/domain/template/MarkdownProperty.js';
import { MediaProperty } from '#api/core/domain/template/MediaProperty.js';
import { MultiDateProperty } from '#api/core/domain/template/MultiDateProperty.js';
import { MultiDateRangeProperty } from '#api/core/domain/template/MultiDateRangeProperty.js';
import { MultiSelectProperty } from '#api/core/domain/template/select/MultiSelectProperty.js';
import { NumericProperty } from '#api/core/domain/template/NumericProperty.js';
import { PreviewProperty } from '#api/core/domain/template/PreviewProperty.js';
import { PropertyFactory } from '#api/core/domain/template/PropertyFactory.js';
import { PropertyTypeEnum } from '#api/core/domain/template/PropertyType.js';
import { SelectProperty } from '#api/core/domain/template/select/SelectProperty.js';
import { TextProperty } from '#api/core/domain/template/TextProperty.js';

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
