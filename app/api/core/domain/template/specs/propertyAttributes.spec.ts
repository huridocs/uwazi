import { DateProperty } from '../DateProperty.js';
import { DateRangeProperty } from '../DateRangeProperty.js';
import { GenerateIdProperty } from '../GenerateIdProperty.js';
import { GeolocationProperty } from '../GeoLocationProperty.js';
import { ImageProperty } from '../ImageProperty.js';
import { LinkProperty } from '../LinkProperty.js';
import { MarkdownProperty } from '../MarkdownProperty.js';
import { MediaProperty } from '../MediaProperty.js';
import { MultiDateProperty } from '../MultiDateProperty.js';
import { MultiDateRangeProperty } from '../MultiDateRangeProperty.js';
import { NestedProperty } from '../NestedProperty.js';
import { NumericProperty } from '../NumericProperty.js';
import { TextProperty } from '../TextProperty.js';
import { V1RelationshipProperty } from '../V1RelationshipProperty.js';
import { MultiSelectProperty } from '../select/MultiSelectProperty.js';
import { SelectProperty } from '../select/SelectProperty.js';

const marks = ['ai_generated', 'ai_generated', 'sync_off'];

type Entry = Record<string, unknown>;

type AssignmentProperty = {
  createPropertyAssignment(
    input: { value: Entry[]; language?: string },
    validate?: boolean
  ): { value: unknown };
};

const values =
  (property: AssignmentProperty, language?: string) =>
  (entries: Entry[]): unknown =>
    property.createPropertyAssignment(
      language ? { value: entries, language } : { value: entries },
      true
    ).value;

const base = { id: 'any_id', label: 'A Title', template: 'any' };

const text = new TextProperty(base);
const markdown = new MarkdownProperty(base);
const numeric = new NumericProperty(base);
const date = new DateProperty(base);
const multiDate = new MultiDateProperty(base);
const dateRange = new DateRangeProperty(base);
const multiDateRange = new MultiDateRangeProperty(base);
const generatedId = new GenerateIdProperty(base);
const geolocation = new GeolocationProperty(base);
const media = new MediaProperty(base);
const image = new ImageProperty(base);
const link = new LinkProperty(base);
const nested = new NestedProperty(base);
const select = new SelectProperty({ ...base, content: 'thes-id' });
const multiselect = new MultiSelectProperty({ ...base, content: 'thes-id' });
const relationship = V1RelationshipProperty.create({
  ...base,
  relationType: 'relates-to',
});

const withMarks = (entry: Entry): Entry => ({ ...entry, attributes: marks });

type Case = {
  name: string;
  assign: (entries: Entry[]) => unknown;
  entry: Entry;
  stored: Entry;
};

const kept = (name: string, assign: (entries: Entry[]) => unknown, entry: Entry): Case => ({
  name,
  assign,
  entry: withMarks(entry),
  stored: withMarks(entry),
});

const same = (name: string, assign: (entries: Entry[]) => unknown, entry: Entry): Case => ({
  name,
  assign,
  entry,
  stored: entry,
});

const cases: Case[] = [
  kept('text', values(text), { value: 'Hello' }),
  kept('markdown', values(markdown), { value: 'Hello' }),
  kept('numeric', values(numeric), { value: 42 }),
  kept('date', values(date), { value: 1761576489 }),
  kept('multidate', values(multiDate), { value: 1761576489 }),
  kept('daterange', values(dateRange), { value: { from: 10, to: 20 } }),
  kept('multidaterange', values(multiDateRange), { value: { from: 10, to: 20 } }),
  kept('generatedid', values(generatedId), { value: 'CPW6528-7568' }),
  kept('geolocation', values(geolocation), { value: { lat: 10, lon: 20, label: 'Point A' } }),
  kept('media', values(media), { value: 'clip.mp4' }),
  {
    name: 'image',
    assign: values(image),
    entry: withMarks({ value: 'photo.jpg' }),
    stored: withMarks({ value: '/api/files/photo.jpg' }),
  },
  kept('image url', values(image), { value: 'https://example.com/a.jpg' }),
  kept('link', values(link), { value: { url: 'https://uwazi.io', label: 'Uwazi' } }),
  kept('select', values(select, 'en'), { value: 'apple', label: 'Apple' }),
  kept('multiselect', values(multiselect, 'en'), { value: 'apple', label: 'Apple' }),
  kept('relationship', values(relationship, 'en'), {
    value: 'shared-1',
    label: 'One',
    type: 'entity',
  }),
  kept('nested', values(nested), {
    value: { child_text: [{ value: 'Some text', attributes: marks }] },
  }),
];

const blankCases: Case[] = [
  same('text', values(text), { value: '', attributes: ['blank'] }),
  {
    name: 'markdown',
    assign: values(markdown),
    entry: { value: '   ', attributes: [] },
    stored: { value: '', attributes: [] },
  },
  same('daterange', values(dateRange), { value: { from: null, to: null }, attributes: [] }),
  same('multidaterange', values(multiDateRange), {
    value: { from: null, to: null },
    attributes: ['blank'],
  }),
  same('generatedid', values(generatedId), { value: '', attributes: ['blank'] }),
  same('media', values(media), { value: '', attributes: ['blank'] }),
  same('image', values(image), { value: '', attributes: [] }),
  same('link', values(link), { value: { url: '' }, attributes: ['blank'] }),
  same('select', values(select, 'en'), { value: '', label: '', attributes: ['blank'] }),
  same('relationship', values(relationship, 'en'), {
    value: '',
    label: '',
    type: 'entity',
    attributes: [],
  }),
];

const droppedWhenBlank: { name: string; assign: (entries: Entry[]) => unknown; entry: Entry }[] = [
  { name: 'numeric', assign: values(numeric), entry: { value: '', attributes: ['blank'] } },
  { name: 'date', assign: values(date), entry: { value: '', attributes: ['blank'] } },
  { name: 'multidate', assign: values(multiDate), entry: { value: '', attributes: ['blank'] } },
  {
    name: 'geolocation',
    assign: values(geolocation),
    entry: { value: { lat: null, lon: null }, attributes: ['blank'] },
  },
];

const withoutAttributes = (entry: Entry) => {
  const { attributes: _attributes, ...rest } = entry;
  return rest;
};

describe('metadata attributes on every property type', () => {
  it.each(cases)('$name keeps attributes beside the value', ({ assign, entry, stored }) => {
    expect(assign([entry])).toEqual([stored]);
  });

  it.each(cases)('$name stores an empty attributes array', ({ assign, entry, stored }) => {
    expect(assign([{ ...entry, attributes: [] }])).toEqual([{ ...stored, attributes: [] }]);
  });

  it.each(cases)('$name omits attributes when the key is absent', ({ assign, entry, stored }) => {
    expect(assign([withoutAttributes(entry)])).toEqual([withoutAttributes(stored)]);
  });

  it.each(cases)(
    '$name rejects attributes that are not an array of strings',
    ({ assign, entry }) => {
      expect(() => assign([{ ...entry, attributes: 'ai_generated' }])).toThrow();
      expect(() => assign([{ ...entry, attributes: [1] }])).toThrow();
    }
  );

  it.each(blankCases)(
    '$name keeps a blank value when attributes is present',
    ({ assign, entry, stored }) => {
      expect(assign([entry])).toEqual([stored]);
    }
  );

  it.each(droppedWhenBlank)(
    '$name drops a blank value even when attributes is present',
    ({ assign, entry }) => {
      expect(assign([entry])).toEqual([]);
    }
  );

  it('keeps attributes on a nested child and rejects a non-array there', () => {
    expect(
      values(nested)([
        { value: { child_text: [{ value: 'Some text', attributes: ['sync_off'] }] } },
      ])
    ).toEqual([{ value: { child_text: [{ value: 'Some text', attributes: ['sync_off'] }] } }]);

    expect(() =>
      values(nested)([{ value: { child_text: [{ value: 'Some text', attributes: [1] }] } }])
    ).toThrow();
  });
});
