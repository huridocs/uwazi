// @ts-expect-error TS(2307): Cannot find module '../templates.v2/model/Template... Remove this comment to see the full error message
import { Template } from 'api/templates.v2/model/Template.js';
// @ts-expect-error TS(2307): Cannot find module '../core/domain/template/TitleP... Remove this comment to see the full error message
import { TitleProperty } from '../core/domain/template/TitleProperty.js';
// @ts-expect-error TS(2307): Cannot find module '../core/domain/template/Creati... Remove this comment to see the full error message
import { CreationDateProperty } from '../core/domain/template/CreationDateProperty.js';
// @ts-expect-error TS(2307): Cannot find module '../core/domain/template/Modifi... Remove this comment to see the full error message
import { ModifiedDateProperty } from '../core/domain/template/ModifiedDateProperty.js';
// @ts-expect-error TS(2307): Cannot find module '../core/domain/template/TextPr... Remove this comment to see the full error message
import { TextProperty } from '../core/domain/template/TextProperty.js';
// @ts-expect-error TS(2307): Cannot find module '../core/domain/template/ImageP... Remove this comment to see the full error message
import { ImageProperty } from '../core/domain/template/ImageProperty.js';
// @ts-expect-error TS(2307): Cannot find module '../core/domain/template/Previe... Remove this comment to see the full error message
import { PreviewProperty } from '../core/domain/template/PreviewProperty.js';
// @ts-expect-error TS(2307): Cannot find module '../core/domain/template/MediaP... Remove this comment to see the full error message
import { MediaProperty } from '../core/domain/template/MediaProperty.js';
// @ts-expect-error TS(2307): Cannot find module '../core/domain/template/Numeri... Remove this comment to see the full error message
import { NumericProperty } from '../core/domain/template/NumericProperty.js';
// @ts-expect-error TS(2307): Cannot find module '../core/domain/template/MultiD... Remove this comment to see the full error message
import { MultiDateRangeProperty } from '../core/domain/template/MultiDateRangeProperty.js';
// @ts-expect-error TS(2307): Cannot find module '../core/domain/template/MultiD... Remove this comment to see the full error message
import { MultiDateProperty } from '../core/domain/template/MultiDateProperty.js';
// @ts-expect-error TS(2307): Cannot find module '../core/domain/template/Markdo... Remove this comment to see the full error message
import { MarkdownProperty } from '../core/domain/template/MarkdownProperty.js';
// @ts-expect-error TS(2307): Cannot find module '../core/domain/template/LinkPr... Remove this comment to see the full error message
import { LinkProperty } from '../core/domain/template/LinkProperty.js';
// @ts-expect-error TS(2307): Cannot find module '../core/domain/template/GeoLoc... Remove this comment to see the full error message
import { GeolocationProperty } from '../core/domain/template/GeoLocationProperty.js';
// @ts-expect-error TS(2307): Cannot find module '../core/domain/template/DatePr... Remove this comment to see the full error message
import { DateProperty } from '../core/domain/template/DateProperty.js';
// @ts-expect-error TS(2307): Cannot find module '../core/domain/template/DateRa... Remove this comment to see the full error message
import { DateRangeProperty } from '../core/domain/template/DateRangeProperty.js';
import { ObjectId } from 'mongodb';
import { TemplateMapper } from '../template/Mapper';

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

    const schema = TemplateMapper.toSchema(template);

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
