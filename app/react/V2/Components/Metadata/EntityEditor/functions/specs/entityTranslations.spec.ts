import type { LanguagesListSchema, PropertyValueSchema } from '#shared/types/commonTypes.js';
import { EMPTY_ICON } from '../../Components/IconField.js';
import type { EditEntityFormValues } from '../buildEditEntityDefaultValues.js';
import type { FormMetadataProperty } from '../formatMetadataForForm.js';
import { buildTranslationsForSave, rekeyEditEntityLanguage } from '../entityTranslations.js';

type ValuesOverrides = {
  title?: EditEntityFormValues['title'];
  metadata?: EditEntityFormValues['metadata'];
  translations?: EditEntityFormValues['translations'];
  touchedTranslations?: EditEntityFormValues['touchedTranslations'];
};
const field = (
  name: string,
  type: FormMetadataProperty['type'],
  required = false
): FormMetadataProperty => ({ _id: name, type, name, label: name, required });
const entry = (value: PropertyValueSchema) => [{ value }];
const bucket = (title: string, description: string, photo: string) => ({
  title: entry(title),
  description: entry(description),
  photo: entry(photo),
});
const fields = (spec: Record<string, FormMetadataProperty['type']>) =>
  Object.entries(spec).map(([name, type]) => field(name, type));
const link = (label: string, url: string) => entry({ label, url });
const languages: LanguagesListSchema = [
  { key: 'en', label: 'English', default: true },
  { key: 'es', label: 'Spanish' },
  { key: 'fr', label: 'French', installing: true },
];
const props = [field('description', 'text'), field('photo', 'image'), field('filed', 'date')];
const textPhoto = [field('description', 'text'), field('photo', 'image')];
const values = (overrides: ValuesOverrides = {}): EditEntityFormValues => ({
  title: 'Hearing',
  template: 't1',
  showIcon: false,
  icon: EMPTY_ICON,
  metadata: { description: entry('Summary'), photo: entry('/en.jpg'), filed: entry(1) },
  translations: { es: bucket('Audiencia', 'Resumen', '/es.jpg') },
  touchedTranslations: {},
  ...overrides,
});
const rekey = (form: EditEntityFormValues, toLanguage: string, metadataProperties = props) =>
  rekeyEditEntityLanguage({ values: form, fromLanguage: 'en', toLanguage, metadataProperties });
const swap = (form: EditEntityFormValues, fromLanguage: string, toLanguage: string) =>
  rekeyEditEntityLanguage({ values: form, fromLanguage, toLanguage, metadataProperties: props });
const save = (form: EditEntityFormValues, properties = textPhoto, languageList = languages) =>
  buildTranslationsForSave({
    values: form,
    metadataProperties: properties,
    languages: languageList,
    currentLanguage: 'en',
  });
const creating = (form: EditEntityFormValues, properties = textPhoto, languageList = languages) =>
  buildTranslationsForSave({
    values: form,
    metadataProperties: properties,
    languages: languageList,
    currentLanguage: 'en',
    createSave: true,
  });
const enHearing = bucket('Hearing', 'Summary', '/en.jpg');
const esHearing = bucket('Audiencia', 'Resumen', '/es.jpg');
describe('rekeyEditEntityLanguage', () => {
  it('moves current translatable values into translations and loads the target language', () => {
    const next = rekey(values({ title: 'Hearing edited' }), 'es');
    expect(next.title).toBe('Audiencia');
    expect(next.metadata.description).toEqual(entry('Resumen'));
    expect(next.metadata.photo).toEqual(entry('/es.jpg'));
    expect(next.metadata.filed).toEqual(entry(1));
    expect(next.translations).toEqual({ en: bucket('Hearing edited', 'Summary', '/en.jpg') });
  });
  it('drops touched flags for the language that became current so missing values still fall back', () => {
    const next = rekey(
      values({
        touchedTranslations: { es: { title: true, description: true }, fr: { title: true } },
      }),
      'es'
    );
    expect(next.touchedTranslations).toEqual({ fr: { title: true } });
  });
  it('returns the same values object when the language does not change', () => {
    const current = values();
    expect(rekey(current, 'en')).toBe(current);
  });
  it('clears title and translatable metadata when the target bucket is missing', () => {
    const next = rekey(values({ translations: {} }), 'es');
    expect(next.title).toBe('');
    expect(next.metadata.description).toEqual([]);
    expect(next.metadata.photo).toEqual([]);
    expect(next.metadata.filed).toEqual(entry(1));
    expect(next.translations?.en?.title).toEqual(entry('Hearing'));
  });
  it('round-trips link label and url when switching languages', () => {
    const next = rekey(
      values({
        metadata: { site: link('English', 'https://en.example'), filed: entry(1) },
        translations: {
          es: { title: entry('Audiencia'), site: link('Español', 'https://es.example') },
        },
      }),
      'es',
      [field('site', 'link'), field('filed', 'date')]
    );
    expect(next.metadata.site).toEqual(link('Español', 'https://es.example'));
    expect(next.metadata.filed).toEqual(entry(1));
    expect(next.translations?.en?.site).toEqual(link('English', 'https://en.example'));
  });
  it('keeps both language buckets after switching away and back on create', () => {
    const created = values({
      title: 'New en',
      translations: {},
      metadata: { description: entry('Summary en'), photo: entry('enPhoto'), filed: entry(1) },
    });
    const inEs = rekey(created, 'es');
    const back = swap(
      {
        ...inEs,
        title: 'Nuevo',
        metadata: { ...inEs.metadata, description: entry('Resumen es'), photo: entry('esPhoto') },
      },
      'es',
      'en'
    );
    expect(back.title).toBe('New en');
    expect(back.metadata.description).toEqual(entry('Summary en'));
    expect(back.metadata.photo).toEqual(entry('enPhoto'));
    expect(save(back, props)).toEqual({ es: bucket('Nuevo', 'Resumen es', 'esPhoto') });
  });
});
describe('buildTranslationsForSave', () => {
  it('omits translations when fewer than two languages are installed', () => {
    expect(save(values(), [field('description', 'text')], [languages[0]])).toBeUndefined();
  });
  it('sends every installed language except current, skipping installing, and passes through non-inline props', () => {
    expect(save(values())).toEqual({ es: esHearing });
  });
  it('copies the current language when a translation language or property is missing', () => {
    expect(save(values({ translations: {} }))).toEqual({ es: enHearing });
  });
  it('copies the current language when a property is absent or an empty array', () => {
    expect(save(values({ translations: { es: { title: entry('Audiencia') } } }))).toEqual({
      es: bucket('Audiencia', 'Summary', '/en.jpg'),
    });
  });
  it('keeps an explicit empty string translation', () => {
    expect(save(values({ translations: { es: bucket('Audiencia', '', '/es.jpg') } }))).toEqual({
      es: { title: entry('Audiencia'), description: entry(''), photo: entry('/es.jpg') },
    });
  });
  it('keeps a touched empty translation instead of copying the current language', () => {
    expect(
      save(
        values({
          translations: { es: { title: entry(''), description: entry(''), photo: [] } },
          touchedTranslations: { es: { title: true, description: true, photo: true } },
        })
      )
    ).toEqual({ es: { title: entry('Hearing'), description: entry(''), photo: [] } });
  });
  it('fills blank required values from the current language', () => {
    expect(
      save(
        values({
          metadata: { summary: entry('Needed') },
          translations: { es: { title: entry(''), summary: entry('') } },
          touchedTranslations: { es: { summary: true } },
        }),
        [field('summary', 'text', true)]
      )
    ).toEqual({ es: { title: entry('Hearing'), summary: entry('Needed') } });
  });
  it('emits every installed non-current language and only translatable property types', () => {
    const copied = {
      title: entry('Hearing'),
      notes: entry('Body'),
      clip: entry('/clip.mp4'),
      card: entry('/card.jpg'),
      site: link('English', 'https://en.example'),
    };
    expect(
      save(
        values({
          metadata: {
            ...copied,
            related: entry('entity-1'),
            status: entry('open'),
            filed: entry(1),
            point: entry({ lat: 1, lon: 2 }),
          },
          translations: {},
        }),
        [
          ...fields({ notes: 'markdown', site: 'link', clip: 'media', card: 'preview' }),
          ...fields({
            related: 'relationship',
            status: 'select',
            filed: 'date',
            point: 'geolocation',
          }),
        ],
        [languages[0], languages[1], { key: 'pt', label: 'Portuguese' }, languages[2]]
      )
    ).toEqual({ es: copied, pt: copied });
  });
  it('copies the current language when an optional untouched value is an empty array', () => {
    expect(
      save(values({ translations: { es: { title: entry('Audiencia'), description: [] } } }), [
        field('description', 'text'),
      ])
    ).toEqual({ es: { title: entry('Audiencia'), description: entry('Summary') } });
  });
  describe('when creating an entity', () => {
    it('omits an installed language the user never edited', () => {
      expect(creating(values())).toBeUndefined();
      expect(creating(values({ touchedTranslations: { es: { title: false } } }))).toBeUndefined();
    });
    it('keeps a language the user edited and copies the other fields from the current language', () => {
      expect(
        creating(
          values({
            translations: { es: { title: entry('Audiencia') } },
            touchedTranslations: { es: { title: true } },
          })
        )
      ).toEqual({ es: bucket('Audiencia', 'Summary', '/en.jpg') });
    });
  });
});
