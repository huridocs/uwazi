import type { LanguagesListSchema, PropertyValueSchema } from '#shared/types/commonTypes.js';
import type { EditEntityFormValues } from '../buildEditEntityDefaultValues.js';
import {
  installedLanguageKeys,
  linkValueWithPart,
  setTranslationText,
  setTranslationTouched,
  storedTranslationValue,
  stringFromValues,
  translationEntryText,
  translationTouchedPath,
  translationValuePath,
} from '../entityTranslations.js';

const entry = (value: PropertyValueSchema) => [{ value }];
const link = (label: string, url: string) => entry({ label, url });
const languages: LanguagesListSchema = [
  { key: 'en', label: 'English', default: true },
  { key: 'es', label: 'Spanish' },
  { key: 'fr', label: 'French', installing: true },
];

describe('setTranslationText', () => {
  const write = (
    translations: EditEntityFormValues['translations'],
    propertyName: string,
    value: string
  ) => setTranslationText({ translations, language: 'es', propertyName, value });
  it('writes a string property into a language bucket', () => {
    expect(write({}, 'title', 'Audiencia')).toEqual({ es: { title: entry('Audiencia') } });
  });
  it('merges a property into an existing language bucket', () => {
    expect(
      write(
        {
          en: { title: entry('Hearing') },
          es: { title: entry('Audiencia'), description: entry('Resumen') },
        },
        'description',
        'Nuevo'
      )
    ).toEqual({
      en: { title: entry('Hearing') },
      es: { title: entry('Audiencia'), description: entry('Nuevo') },
    });
  });
});
describe('translation readers', () => {
  const site = link('Sitio', 'https://es.example');
  it('drops languages that are still installing', () => {
    expect(installedLanguageKeys(languages)).toEqual(['en', 'es']);
  });
  it('returns an empty string when values are missing, empty, or not a string', () => {
    expect(stringFromValues()).toBe('');
    expect(stringFromValues([])).toBe('');
    expect(stringFromValues(entry(1))).toBe('');
  });
  it('reads the first value wrapper and ignores non-arrays and empty lists', () => {
    expect(storedTranslationValue('Audiencia')).toBeUndefined();
    expect(storedTranslationValue([])).toBeUndefined();
    expect(storedTranslationValue([{}])).toBeUndefined();
    expect(storedTranslationValue(entry('Audiencia'))).toBe('Audiencia');
    expect(storedTranslationValue(site)).toEqual({ label: 'Sitio', url: 'https://es.example' });
  });
  it('returns string text, link parts, and an empty string for malformed links', () => {
    expect(translationEntryText(entry('Audiencia'))).toBe('Audiencia');
    expect(translationEntryText(entry(1))).toBe('');
    expect(translationEntryText('Audiencia')).toBe('');
    expect(translationEntryText(site, 'label')).toBe('Sitio');
    expect(translationEntryText(site, 'url')).toBe('https://es.example');
    expect(translationEntryText(site)).toBe('');
    expect(
      translationEntryText([{ value: { label: 1, url: 'https://es.example' } }], 'label')
    ).toBe('');
    expect(translationEntryText([{ value: { foo: 'bar' } }], 'url')).toBe('');
  });
  it('builds the value and touched field paths', () => {
    expect(translationValuePath('es', 'title')).toBe('translations.es.title');
    expect(translationTouchedPath('es', 'description')).toBe('touchedTranslations.es.description');
  });
  it('sets one flag without wiping other languages or properties', () => {
    const touched = { es: { title: true }, fr: { description: true } };
    expect(setTranslationTouched({ touched, language: 'es', propertyName: 'photo' })).toEqual({
      es: { title: true, photo: true },
      fr: touched.fr,
    });
  });
});
describe('linkValueWithPart', () => {
  const existing = { label: 'S', url: 'http://e' };
  const fallback = { label: 'E', url: 'http://e' };
  const part = (linkPart: 'label' | 'url', text: string, current: unknown = existing) =>
    linkValueWithPart({ existing: current, fallback, part: linkPart, text });
  it('keeps the other link part, prefers an existing record, and falls back otherwise', () => {
    expect(part('label', 'N')).toEqual({ label: 'N', url: 'http://e' });
    expect(part('url', 'http://n')).toEqual({ label: 'S', url: 'http://n' });
    expect(part('label', 'S', { url: 'http://e' })).toEqual({ label: 'S', url: 'http://e' });
    expect(part('url', 'http://n', 'nope')).toEqual({ label: 'E', url: 'http://n' });
  });
});
