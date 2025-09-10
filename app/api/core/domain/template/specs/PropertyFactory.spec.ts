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
import { SelectProperty } from '../SelectProperty';
import { TextProperty } from '../TextProperty';

describe('PropertyFactory', () => {
  it('should create an instance of TextProperty', () => {
    expect(
      PropertyFactory.create({
        template: 'any',
        id: 'any_id',
        label: 'A text property',
        type: 'text',
      })
    ).toBeInstanceOf(TextProperty);
  });

  it('should create an instance of NumericProperty', () => {
    expect(
      PropertyFactory.create({
        template: 'any',
        id: 'any_id',
        label: 'A numeric property',
        type: 'numeric',
      })
    ).toBeInstanceOf(NumericProperty);
  });

  it('should create an instance of PreviewProperty', () => {
    expect(
      PropertyFactory.create({
        template: 'any',
        id: 'any_id',
        label: 'A numeric property',
        type: 'preview',
      })
    ).toBeInstanceOf(PreviewProperty);
  });

  it('should create an instance of MultiDateProperty', () => {
    expect(
      PropertyFactory.create({
        template: 'any',
        id: 'any_id',
        label: 'A numeric property',
        type: 'multidate',
      })
    ).toBeInstanceOf(MultiDateProperty);
  });

  it('should create an instance of MultiDateRangeProperty', () => {
    expect(
      PropertyFactory.create({
        template: 'any',
        id: 'any_id',
        label: 'A numeric property',
        type: 'multidaterange',
      })
    ).toBeInstanceOf(MultiDateRangeProperty);
  });

  it('should create an instance of MediaProperty', () => {
    expect(
      PropertyFactory.create({
        template: 'any',
        id: 'any_id',
        label: 'A numeric property',
        type: 'media',
      })
    ).toBeInstanceOf(MediaProperty);
  });

  it('should create an instance of MarkdownProperty', () => {
    expect(
      PropertyFactory.create({
        template: 'any',
        id: 'any_id',
        label: 'A numeric property',
        type: 'markdown',
      })
    ).toBeInstanceOf(MarkdownProperty);
  });

  it('should create an instance of LinkProperty', () => {
    expect(
      PropertyFactory.create({
        template: 'any',
        id: 'any_id',
        label: 'A numeric property',
        type: 'link',
      })
    ).toBeInstanceOf(LinkProperty);
  });

  it('should create an instance of ImageProperty', () => {
    expect(
      PropertyFactory.create({
        template: 'any',
        id: 'any_id',
        label: 'A numeric property',
        type: 'image',
      })
    ).toBeInstanceOf(ImageProperty);
  });

  it('should create an instance of GeolocationProperty', () => {
    expect(
      PropertyFactory.create({
        template: 'any',
        id: 'any_id',
        label: 'A numeric property',
        type: 'geolocation',
      })
    ).toBeInstanceOf(GeolocationProperty);
  });

  it('should create an instance of DateRangeProperty', () => {
    expect(
      PropertyFactory.create({
        template: 'any',
        id: 'any_id',
        label: 'A numeric property',
        type: 'daterange',
      })
    ).toBeInstanceOf(DateRangeProperty);
  });

  it('should create an instance of DateProperty', () => {
    expect(
      PropertyFactory.create({
        template: 'any',
        id: 'any_id',
        label: 'A numeric property',
        type: 'date',
      })
    ).toBeInstanceOf(DateProperty);
  });

  it('should create an instance of GenerateIdProperty', () => {
    expect(
      PropertyFactory.create({
        template: 'any',
        id: 'any_id',
        label: 'A numeric property',
        type: 'generatedid',
      })
    ).toBeInstanceOf(GenerateIdProperty);
  });

  it('should create an instance of SelectProperty', () => {
    expect(
      PropertyFactory.create({
        template: 'any',
        id: 'any_id',
        label: 'A numeric property',
        type: 'select',
        content: 'any',
      })
    ).toBeInstanceOf(SelectProperty);
  });

  it('should create an instance of MultiSelectProperty', () => {
    expect(
      PropertyFactory.create({
        template: 'any',
        id: 'any_id',
        label: 'A numeric property',
        type: 'multiselect',
        content: 'any',
      })
    ).toBeInstanceOf(MultiSelectProperty);
  });
});
