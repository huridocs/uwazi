import { EMPTY_ICON } from '../../Components/IconField.js';
import type { EditEntityFormValues } from '../buildEditEntityDefaultValues.js';
import type { FormMetadataProperty } from '../formatMetadataForForm.js';
import {
  buildTranslationsForSave,
  rekeyEditEntityLanguage,
  setTranslationText,
} from '../entityTranslations.js';

const entry = (value: string) => [{ value }];
const field = (name: string, type: FormMetadataProperty['type']): FormMetadataProperty => ({
  _id: name,
  type,
  name,
  label: name,
});
const form = (translations: EditEntityFormValues['translations']): EditEntityFormValues => ({
  title: 'Hearing',
  template: 't1',
  showIcon: false,
  icon: EMPTY_ICON,
  metadata: { description: entry('Summary'), photo: entry('/en.jpg'), filed: [{ value: 1 }] },
  translations,
  touchedTranslations: {},
});

describe('translation attributes', () => {
  it('keeps value attributes when switching to a language that stores them', () => {
    const next = rekeyEditEntityLanguage({
      values: form({
        es: {
          title: entry('Audiencia'),
          description: [{ value: 'Resumen', attributes: ['ai_generated', 'sync_off'] }],
          photo: [{ value: '/es.jpg', attributes: [] }],
        },
      }),
      fromLanguage: 'en',
      toLanguage: 'es',
      metadataProperties: [
        field('description', 'text'),
        field('photo', 'image'),
        field('filed', 'date'),
      ],
    });
    expect(next.metadata.description).toEqual([
      { value: 'Resumen', attributes: ['ai_generated', 'sync_off'] },
    ]);
    expect(next.metadata.photo).toEqual([{ value: '/es.jpg', attributes: [] }]);
  });

  it('does not copy attributes into a translation that has no elements of its own', () => {
    const saved = buildTranslationsForSave({
      values: form({}),
      metadataProperties: [field('description', 'text'), field('photo', 'image')],
      languages: [
        { key: 'en', label: 'English', default: true },
        { key: 'es', label: 'Spanish' },
      ],
      currentLanguage: 'en',
    });
    const withMarks = form({
      es: {},
    });
    withMarks.metadata.description = [{ value: 'Summary', attributes: ['ai_generated'] }];
    const marked = buildTranslationsForSave({
      values: withMarks,
      metadataProperties: [field('description', 'text')],
      languages: [
        { key: 'en', label: 'English', default: true },
        { key: 'es', label: 'Spanish' },
      ],
      currentLanguage: 'en',
    });
    expect(saved?.es.description).toEqual([{ value: 'Summary' }]);
    expect(marked?.es.description).toEqual([{ value: 'Summary' }]);
  });

  it('keeps attributes when the translated text changes', () => {
    expect(
      setTranslationText({
        translations: {
          es: { description: [{ value: 'Resumen', attributes: ['ai_generated'] }] },
        },
        language: 'es',
        propertyName: 'description',
        value: 'Nuevo',
      })
    ).toEqual({
      es: { description: [{ value: 'Nuevo', attributes: ['ai_generated'] }] },
    });
  });
});
