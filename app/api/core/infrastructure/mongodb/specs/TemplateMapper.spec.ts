import { Template } from 'api/core/domain/template/Template';
import { TitleProperty } from 'api/core/domain/template/TitleProperty';
import { CreationDateProperty } from 'api/core/domain/template/CreationDateProperty';
import { ModifiedDateProperty } from 'api/core/domain/template/ModifiedDateProperty';
import { TextProperty } from 'api/core/domain/template/TextProperty';
import { ImageProperty } from 'api/core/domain/template/ImageProperty';
import { PreviewProperty } from 'api/core/domain/template/PreviewProperty';
import { MediaProperty } from 'api/core/domain/template/MediaProperty';
import { NumericProperty } from 'api/core/domain/template/NumericProperty';
import { MultiDateRangeProperty } from 'api/core/domain/template/MultiDateRangeProperty';
import { MultiDateProperty } from 'api/core/domain/template/MultiDateProperty';
import { MarkdownProperty } from 'api/core/domain/template/MarkdownProperty';
import { LinkProperty } from 'api/core/domain/template/LinkProperty';
import { GeolocationProperty } from 'api/core/domain/template/GeoLocationProperty';
import { DateProperty } from 'api/core/domain/template/DateProperty';
import { DateRangeProperty } from 'api/core/domain/template/DateRangeProperty';
import { ObjectId } from 'mongodb';
import { MongoTemplateMapper } from '../template/Mapper';

const IDS = {
  TEMPLATE: new ObjectId(),
  TITLE: new ObjectId(),
  CREATION_DATE: new ObjectId(),
  MODIFIED_DATE: new ObjectId(),
  TEXT: new ObjectId(),
  IMAGE: new ObjectId(),
  PREVIEW: new ObjectId(),
  MEDIA: new ObjectId(),
  NUMERIC: new ObjectId(),
  MULTIDATERANGE: new ObjectId(),
  MULTIDATE: new ObjectId(),
  MARKDOWN: new ObjectId(),
  LINK: new ObjectId(),
  GEOLOCATION: new ObjectId(),
  DATE: new ObjectId(),
  DATERANGE: new ObjectId(),
};

describe('TemplateMapper', () => {
  it('should map Template domain to TemplateDBO schema correctly', () => {
    const template = new Template(
      IDS.TEMPLATE.toHexString(),
      'My Template',

      [
        new TextProperty({ id: IDS.TEXT.toHexString(), label: 'Description', template: '' }),
        new ImageProperty({ id: IDS.IMAGE.toHexString(), label: 'Photo', template: '' }),
        new PreviewProperty({ id: IDS.PREVIEW.toHexString(), label: 'Preview', template: '' }),
        new MediaProperty({ id: IDS.MEDIA.toHexString(), label: 'Media', template: '' }),
        new NumericProperty({ id: IDS.NUMERIC.toHexString(), label: 'Numeric', template: '' }),
        new MultiDateRangeProperty({
          id: IDS.MULTIDATERANGE.toHexString(),
          label: 'MultiDateRange',
          template: '',
        }),
        new MultiDateProperty({
          id: IDS.MULTIDATE.toHexString(),
          label: 'MultiDate',
          template: '',
        }),
        new MarkdownProperty({ id: IDS.MARKDOWN.toHexString(), label: 'Markdown', template: '' }),
        new LinkProperty({ id: IDS.LINK.toHexString(), label: 'Link', template: '' }),
        new GeolocationProperty({
          id: IDS.GEOLOCATION.toHexString(),
          label: 'Geolocation',
          template: '',
        }),
        new DateProperty({ id: IDS.DATE.toHexString(), label: 'Date', template: '' }),
        new DateRangeProperty({
          id: IDS.DATERANGE.toHexString(),
          label: 'DateRange',
          template: '',
        }),
      ],
      [
        new TitleProperty({ id: IDS.TITLE.toHexString(), label: 'Title', template: '' }),
        new CreationDateProperty({
          id: IDS.CREATION_DATE.toHexString(),
          label: 'Created At',
          template: '',
        }),
        new ModifiedDateProperty({
          id: IDS.MODIFIED_DATE.toHexString(),
          label: 'Modified At',
          template: '',
        }),
      ],
      'red',
      true
    );

    const schema = MongoTemplateMapper.toSchema(template);

    expect(schema).toEqual({
      _id: IDS.TEMPLATE,
      color: 'red',
      name: 'My Template',
      default: true,
      entityViewPage: '',
      processing: {
        active: false,
      },
      commonProperties: [
        {
          _id: IDS.TITLE,
          type: 'text',
          label: 'Title',
          name: 'title',
          isCommonProperty: true,
          noLabel: false,
          required: false,
          showInCard: false,
          generatedId: false,
          prioritySorting: false,
        },
        {
          _id: IDS.CREATION_DATE,
          type: 'date',
          label: 'Created At',
          name: 'creationDate',
          isCommonProperty: true,
          noLabel: false,
          required: false,
          showInCard: false,
          prioritySorting: false,
        },
        {
          _id: IDS.MODIFIED_DATE,
          type: 'date',
          label: 'Modified At',
          name: 'editDate',
          isCommonProperty: true,
          noLabel: false,
          required: false,
          showInCard: false,
          prioritySorting: false,
        },
      ],
      properties: [
        {
          _id: IDS.TEXT,
          type: 'text',
          label: 'Description',
          name: 'description',
          noLabel: false,
          required: false,
          showInCard: false,
          generatedId: false,
          filter: false,
          defaultfilter: false,
          prioritySorting: false,
        },
        {
          _id: IDS.IMAGE,
          type: 'image',
          label: 'Photo',
          name: 'photo',
          noLabel: false,
          required: false,
          showInCard: false,
          style: 'cover',
          fullWidth: false,
        },
        {
          _id: IDS.PREVIEW,
          type: 'preview',
          label: 'Preview',
          name: 'preview',
          noLabel: false,
          required: false,
          showInCard: false,
          style: 'cover',
          fullWidth: false,
        },
        {
          _id: IDS.MEDIA,
          type: 'media',
          label: 'Media',
          name: 'media',
          noLabel: false,
          required: false,
          showInCard: false,
          style: 'cover',
          fullWidth: false,
        },
        {
          _id: IDS.NUMERIC,
          type: 'numeric',
          label: 'Numeric',
          name: 'numeric',
          noLabel: false,
          required: false,
          showInCard: false,
          filter: false,
          defaultfilter: false,
          prioritySorting: false,
        },
        {
          _id: IDS.MULTIDATERANGE,
          type: 'multidaterange',
          label: 'MultiDateRange',
          name: 'multidaterange',
          noLabel: false,
          required: false,
          showInCard: false,
          filter: false,
          defaultfilter: false,
          prioritySorting: false,
        },
        {
          _id: IDS.MULTIDATE,
          type: 'multidate',
          label: 'MultiDate',
          name: 'multidate',
          noLabel: false,
          required: false,
          showInCard: false,
          filter: false,
          defaultfilter: false,
          prioritySorting: false,
        },
        {
          _id: IDS.MARKDOWN,
          type: 'markdown',
          label: 'Markdown',
          name: 'markdown',
          noLabel: false,
          required: false,
          showInCard: false,
          filter: false,
          defaultfilter: false,
          prioritySorting: false,
        },
        {
          _id: IDS.LINK,
          type: 'link',
          label: 'Link',
          name: 'link',
          noLabel: false,
          required: false,
          showInCard: false,
        },
        {
          _id: IDS.GEOLOCATION,
          type: 'geolocation',
          label: 'Geolocation',
          name: 'geolocation_geolocation',
          noLabel: false,
          required: false,
          showInCard: false,
        },
        {
          _id: IDS.DATE,
          type: 'date',
          label: 'Date',
          name: 'date',
          noLabel: false,
          required: false,
          showInCard: false,
          filter: false,
          defaultfilter: false,
          prioritySorting: false,
        },
        {
          _id: IDS.DATERANGE,
          type: 'daterange',
          label: 'DateRange',
          name: 'daterange',
          noLabel: false,
          required: false,
          showInCard: false,
          filter: false,
          defaultfilter: false,
          prioritySorting: false,
        },
      ],
    });
  });
});
