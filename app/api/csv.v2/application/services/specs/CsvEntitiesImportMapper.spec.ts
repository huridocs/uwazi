import moment from 'moment';
import { LanguageISO6391 } from 'shared/types/commonTypes';
import { TemplateBuilder } from 'api/core/domain/template/specs/TemplateBuilder';
import { TextProperty } from 'api/core/domain/template/TextProperty';
import { MarkdownProperty } from 'api/core/domain/template/MarkdownProperty';
import { NumericProperty } from 'api/core/domain/template/NumericProperty';
import { DateProperty } from 'api/core/domain/template/DateProperty';
import { MultiDateProperty } from 'api/core/domain/template/MultiDateProperty';
import { DateRangeProperty } from 'api/core/domain/template/DateRangeProperty';
import { MultiDateRangeProperty } from 'api/core/domain/template/MultiDateRangeProperty';
import { LinkProperty } from 'api/core/domain/template/LinkProperty';
import { GeolocationProperty } from 'api/core/domain/template/GeoLocationProperty';
import { SelectProperty } from 'api/core/domain/template/select/SelectProperty';
import { MultiSelectProperty } from 'api/core/domain/template/select/MultiSelectProperty';
import { GenerateIdProperty } from 'api/core/domain/template/GenerateIdProperty';
import { ImageProperty } from 'api/core/domain/template/ImageProperty';
import { MediaProperty } from 'api/core/domain/template/MediaProperty';
import { PreviewProperty } from 'api/core/domain/template/PreviewProperty';
import { V1RelationshipProperty } from 'api/core/domain/template/V1RelationshipProperty';
import { CsvHeaderAnalyzer } from '../CsvHeaderAnalyzer';
import { CsvEntitiesImportMapper, AppliedValueIndex } from '../CsvEntitiesImportMapper';

const TEMPLATE_ID = 'template-1';
const DEFAULT_LANGUAGE = 'en' as LanguageISO6391;
const LANGUAGES = ['en', 'es'] as LanguageISO6391[];

const buildAssignments = (params: {
  properties: any[];
  headers: string[];
  rowValues: string[];
  thesaurusIndex?: AppliedValueIndex;
  relationshipIndex?: Map<string, Map<string, { sharedId: string; label: string }>>;
}) => {
  const {
    properties,
    headers,
    rowValues,
    thesaurusIndex = new Map(),
    relationshipIndex = new Map(),
  } = params;
  const template = TemplateBuilder.aTemplate({
    id: TEMPLATE_ID,
    properties,
  }).build();
  const headerAnalysis = CsvHeaderAnalyzer.analyze(headers, template, {
    availableLanguages: LANGUAGES,
    defaultLanguage: DEFAULT_LANGUAGE,
    newNameGeneration: false,
  });
  const sanitizedHeaders = CsvEntitiesImportMapper.sanitizeHeaders(headers, false);
  return CsvEntitiesImportMapper.buildPropertyAssignments({
    template,
    headerAnalysis,
    sanitizedHeaders,
    rowValues,
    thesaurusIndex,
    relationshipIndex,
    languages: LANGUAGES,
    defaultLanguage: DEFAULT_LANGUAGE,
  });
};

const mapThesaurus = (id: string, values: Array<{ label: string; valueId: string }>) => {
  const entries = new Map<string, { valueId: string; label: string }>();
  values.forEach(value => {
    entries.set(value.label.toLowerCase(), value);
  });
  return [id, entries] as const;
};

describe('CsvEntitiesImportMapper', () => {
  // eslint-disable-next-line max-statements
  it('should use default-language columns for select and multiselect', () => {
    const select = new SelectProperty({
      id: 'select',
      name: 'select',
      label: 'Select',
      template: TEMPLATE_ID,
      content: 'thesaurus-1',
    });
    const multiselect = new MultiSelectProperty({
      id: 'multi',
      name: 'multiselect',
      label: 'Multi',
      template: TEMPLATE_ID,
      content: 'thesaurus-2',
    });
    const headers = ['select__en', 'select__es', 'multiselect__en', 'multiselect__es'];
    const rowValues = ['Foo', 'Bar', 'Foo|Baz', 'Bar|Qux'];
    const thesaurusIndex: AppliedValueIndex = new Map([
      mapThesaurus('thesaurus-1', [{ label: 'Foo', valueId: 'id-foo' }]),
      mapThesaurus('thesaurus-2', [
        { label: 'Foo', valueId: 'id-foo' },
        { label: 'Baz', valueId: 'id-baz' },
      ]),
    ]);

    const assignments = buildAssignments({
      properties: [select, multiselect],
      headers,
      rowValues,
      thesaurusIndex,
    });

    const selectAssignments = assignments.filter(a => a.value.name === 'select');
    const multiselectAssignments = assignments.filter(a => a.value.name === 'multiselect');

    expect(selectAssignments).toHaveLength(2);
    expect(selectAssignments[0].value.value[0].value).toBe('id-foo');
    expect(selectAssignments[1].value.value[0].value).toBe('id-foo');

    expect(multiselectAssignments).toHaveLength(2);
    multiselectAssignments.forEach(assignment => {
      expect(assignment.value.value.map(v => v.value)).toEqual(['id-foo', 'id-baz']);
    });
  });

  // eslint-disable-next-line max-statements
  it('should normalize text, markdown, and numeric using domain rules', () => {
    const text = new TextProperty({
      id: 'text',
      name: 'text',
      label: 'Text',
      template: TEMPLATE_ID,
    });
    const markdown = new MarkdownProperty({
      id: 'markdown',
      name: 'markdown',
      label: 'Markdown',
      template: TEMPLATE_ID,
    });
    const numeric = new NumericProperty({
      id: 'numeric',
      name: 'numeric',
      label: 'Numeric',
      template: TEMPLATE_ID,
    });
    const headers = ['text', 'markdown', 'numeric'];
    const rowValues = ['  hello  ', '  **md**  ', '42'];

    const assignments = buildAssignments({
      properties: [text, markdown, numeric],
      headers,
      rowValues,
    });
    const byName = Object.fromEntries(assignments.map(a => [a.value.name, a.value]));

    expect(byName.text.value[0].value).toBe('hello');
    expect(byName.markdown.value[0].value).toBe('**md**');
    expect(byName.numeric.value[0].value).toBe(42);
  });

  // eslint-disable-next-line max-statements
  it('should handle image, media, preview, and relationship assignments', () => {
    const image = new ImageProperty({
      id: 'image',
      name: 'image',
      label: 'Image',
      template: TEMPLATE_ID,
    });
    const media = new MediaProperty({
      id: 'media',
      name: 'media',
      label: 'Media',
      template: TEMPLATE_ID,
    });
    const preview = new PreviewProperty({
      id: 'preview',
      name: 'preview',
      label: 'Preview',
      template: TEMPLATE_ID,
    });
    const relationship = new V1RelationshipProperty(
      'rel',
      'relationship',
      'Relationship',
      'related',
      TEMPLATE_ID,
      'related-template'
    );
    const headers = ['image', 'media', 'preview', 'relationship'];
    const rowValues = ['photo.jpg', 'video.mp4', 'ignored', 'related-title|related-two'];
    const relationshipIndex = new Map([
      [
        'related-template',
        new Map([
          ['related-title', { sharedId: 'shared-1', label: 'related-title' }],
          ['related-two', { sharedId: 'shared-2', label: 'related-two' }],
        ]),
      ],
    ]);

    const assignments = buildAssignments({
      properties: [image, media, preview, relationship],
      headers,
      rowValues,
      relationshipIndex,
    });
    const byName = Object.fromEntries(assignments.map(a => [a.value.name, a.value]));

    expect(byName.image.value[0].value).toBe('/api/files/photo.jpg');
    expect(byName.media.value[0].value).toBe('video.mp4');
    expect(byName.preview.value).toEqual([]);
    expect(byName.relationship.value).toEqual([
      { value: 'shared-1', label: 'related-title', type: 'entity' },
      { value: 'shared-2', label: 'related-two', type: 'entity' },
    ]);
  });

  it('should skip generatedid when CSV value is empty', () => {
    const generated = new GenerateIdProperty({
      id: 'generated',
      name: 'generatedid',
      label: 'Generated',
      template: TEMPLATE_ID,
    });
    const headers = ['generatedid'];
    const rowValues = [''];

    const assignments = buildAssignments({ properties: [generated], headers, rowValues });

    expect(assignments).toHaveLength(0);
  });

  // eslint-disable-next-line max-statements
  it('should parse date-like types using the default date format', () => {
    const date = new DateProperty({
      id: 'date',
      name: 'date',
      label: 'Date',
      template: TEMPLATE_ID,
    });
    const headers = ['date'];
    const rowValues = ['2020-01-01'];
    const assignments = buildAssignments({ properties: [date], headers, rowValues });
    expect(assignments).toHaveLength(2);
    const [assignment] = assignments;
    const timestamp = assignment.value.value[0].value as number;
    expect(moment.utc(timestamp, 'X').format('YYYY-MM-DD')).toBe('2020-01-01');
  });

  it('should parse geolocation and link values', () => {
    const link = new LinkProperty({
      id: 'link',
      name: 'link',
      label: 'Link',
      template: TEMPLATE_ID,
    });
    const geo = new GeolocationProperty({
      id: 'geo',
      name: 'geolocation',
      label: 'Geolocation',
      template: TEMPLATE_ID,
    });
    const linkAssignments = buildAssignments({
      properties: [link],
      headers: ['link'],
      rowValues: ['label|http://example.com'],
    });
    const geoAssignments = buildAssignments({
      properties: [geo],
      headers: ['geolocation'],
      rowValues: ['1.2|3.4'],
    });
    expect(linkAssignments[0].value.value[0].value).toEqual({
      label: 'label',
      url: 'http://example.com',
    });
    expect(geoAssignments[0].value.value[0].value).toEqual({
      lat: 1.2,
      lon: 3.4,
      label: '',
    });
  });

  // eslint-disable-next-line max-statements
  it('should parse multi-date and date-range types', () => {
    const multidate = new MultiDateProperty({
      id: 'multi-date',
      name: 'multidate',
      label: 'Multi Date',
      template: TEMPLATE_ID,
    });
    const daterange = new DateRangeProperty({
      id: 'daterange',
      name: 'daterange',
      label: 'Date Range',
      template: TEMPLATE_ID,
    });
    const multidaterange = new MultiDateRangeProperty({
      id: 'multi-range',
      name: 'multidaterange',
      label: 'Multi Range',
      template: TEMPLATE_ID,
    });
    const multiAssignments = buildAssignments({
      properties: [multidate],
      headers: ['multidate'],
      rowValues: ['2020|2021'],
    });
    const rangeAssignments = buildAssignments({
      properties: [daterange],
      headers: ['daterange'],
      rowValues: ['2020:2021'],
    });
    const multiRangeAssignments = buildAssignments({
      properties: [multidaterange],
      headers: ['multidaterange'],
      rowValues: ['2020:2021|2022:2023'],
    });

    const multiDates = multiAssignments[0].value.value.map(entry => {
      const timestamp = entry.value as number;
      return moment.utc(timestamp, 'X').format('YYYY');
    });
    expect(multiDates).toEqual(['2020', '2021']);
    const range = rangeAssignments[0].value.value[0].value as { from: number; to: number };
    expect(moment.utc(range.from, 'X').format('YYYY')).toBe('2020');
    expect(moment.utc(range.to, 'X').format('YYYY')).toBe('2021');
    const multiRange = multiRangeAssignments[0].value.value.map(entry => {
      const value = entry.value as { from: number; to: number };
      return {
        from: moment.utc(value.from, 'X').format('YYYY'),
        to: moment.utc(value.to, 'X').format('YYYY'),
      };
    });
    expect(multiRange).toEqual([
      { from: '2020', to: '2021' },
      { from: '2022', to: '2023' },
    ]);
  });
});
