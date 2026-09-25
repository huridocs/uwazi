import type { LanguagesListSchema } from '#shared/types/commonTypes.js';
import { EMPTY_ICON } from '../../Components/IconField.js';
import type { EditEntityFormValues } from '../buildEditEntityDefaultValues.js';
import type { FormMetadataProperty } from '../formatMetadataForForm.js';
import {
  buildTranslationsForSave,
  rekeyEditEntityLanguage,
  setTranslationText,
} from '../entityTranslations.js';

const textProp = (name: string): FormMetadataProperty => ({
  _id: name,
  type: 'text',
  name,
  label: name,
});

const imageProp = (name: string): FormMetadataProperty => ({
  _id: name,
  type: 'image',
  name,
  label: name,
});

const dateProp = (name: string): FormMetadataProperty => ({
  _id: name,
  type: 'date',
  name,
  label: name,
});

const languages: LanguagesListSchema = [
  { key: 'en', label: 'English', default: true },
  { key: 'es', label: 'Spanish' },
  { key: 'fr', label: 'French', installing: true },
];

const values = (overrides: Partial<EditEntityFormValues> = {}): EditEntityFormValues => ({
  title: 'Hearing',
  template: 't1',
  showIcon: false,
  icon: EMPTY_ICON,
  metadata: {
    description: [{ value: 'Summary' }],
    photo: [{ value: '/en.jpg' }],
    filed: [{ value: 1 }],
  },
  translations: {
    es: {
      title: [{ value: 'Audiencia' }],
      description: [{ value: 'Resumen' }],
      photo: [{ value: '/es.jpg' }],
    },
  },
  touchedTranslations: {},
  ...overrides,
});

describe('rekeyEditEntityLanguage', () => {
  it('moves current translatable values into translations and loads the target language', () => {
    const next = rekeyEditEntityLanguage({
      values: values({ title: 'Hearing edited' }),
      fromLanguage: 'en',
      toLanguage: 'es',
      metadataProperties: [textProp('description'), imageProp('photo'), dateProp('filed')],
    });

    expect(next.title).toBe('Audiencia');
    expect(next.metadata.description).toEqual([{ value: 'Resumen' }]);
    expect(next.metadata.photo).toEqual([{ value: '/es.jpg' }]);
    expect(next.metadata.filed).toEqual([{ value: 1 }]);
    expect(next.translations).toEqual({
      en: {
        title: [{ value: 'Hearing edited' }],
        description: [{ value: 'Summary' }],
        photo: [{ value: '/en.jpg' }],
      },
    });
  });

  it('drops touched flags for the language that became current so missing values still fall back', () => {
    const next = rekeyEditEntityLanguage({
      values: values({
        touchedTranslations: { es: { title: true, description: true }, fr: { title: true } },
      }),
      fromLanguage: 'en',
      toLanguage: 'es',
      metadataProperties: [textProp('description'), imageProp('photo'), dateProp('filed')],
    });

    expect(next.touchedTranslations).toEqual({ fr: { title: true } });
  });

  it('keeps both language buckets after switching away and back on create', () => {
    const props = [textProp('description'), imageProp('photo'), dateProp('filed')];
    const created = values({
      title: 'New en',
      translations: {},
      metadata: {
        description: [{ value: 'Summary en' }],
        photo: [{ value: 'enPhoto' }],
        filed: [{ value: 1 }],
      },
    });
    const inEs = rekeyEditEntityLanguage({
      values: created,
      fromLanguage: 'en',
      toLanguage: 'es',
      metadataProperties: props,
    });
    const back = rekeyEditEntityLanguage({
      values: {
        ...inEs,
        title: 'Nuevo',
        metadata: {
          ...inEs.metadata,
          description: [{ value: 'Resumen es' }],
          photo: [{ value: 'esPhoto' }],
        },
      },
      fromLanguage: 'es',
      toLanguage: 'en',
      metadataProperties: props,
    });

    expect(back.title).toBe('New en');
    expect(back.metadata.description).toEqual([{ value: 'Summary en' }]);
    expect(back.metadata.photo).toEqual([{ value: 'enPhoto' }]);
    expect(
      buildTranslationsForSave({
        values: back,
        metadataProperties: props,
        languages,
        currentLanguage: 'en',
      })
    ).toEqual({
      es: {
        title: [{ value: 'Nuevo' }],
        description: [{ value: 'Resumen es' }],
        photo: [{ value: 'esPhoto' }],
      },
    });
  });
});

describe('buildTranslationsForSave', () => {
  it('omits translations when fewer than two languages are installed', () => {
    expect(
      buildTranslationsForSave({
        values: values(),
        metadataProperties: [textProp('description')],
        languages: [languages[0]],
        currentLanguage: 'en',
      })
    ).toBeUndefined();
  });

  it('sends every installed language except current, skipping installing, and passes through non-inline props', () => {
    expect(
      buildTranslationsForSave({
        values: values(),
        metadataProperties: [textProp('description'), imageProp('photo')],
        languages,
        currentLanguage: 'en',
      })
    ).toEqual({
      es: {
        title: [{ value: 'Audiencia' }],
        description: [{ value: 'Resumen' }],
        photo: [{ value: '/es.jpg' }],
      },
    });
  });

  it('copies the current language when a translation language or property is missing', () => {
    expect(
      buildTranslationsForSave({
        values: values({ translations: {} }),
        metadataProperties: [textProp('description'), imageProp('photo')],
        languages,
        currentLanguage: 'en',
      })
    ).toEqual({
      es: {
        title: [{ value: 'Hearing' }],
        description: [{ value: 'Summary' }],
        photo: [{ value: '/en.jpg' }],
      },
    });
  });

  it('copies the current language when a property is absent or an empty array', () => {
    expect(
      buildTranslationsForSave({
        values: values({ translations: { es: { title: [{ value: 'Audiencia' }] } } }),
        metadataProperties: [textProp('description'), imageProp('photo')],
        languages,
        currentLanguage: 'en',
      })
    ).toEqual({
      es: {
        title: [{ value: 'Audiencia' }],
        description: [{ value: 'Summary' }],
        photo: [{ value: '/en.jpg' }],
      },
    });
  });

  it('keeps an explicit empty string translation', () => {
    expect(
      buildTranslationsForSave({
        values: values({
          translations: {
            es: {
              title: [{ value: 'Audiencia' }],
              description: [{ value: '' }],
              photo: [{ value: '/es.jpg' }],
            },
          },
        }),
        metadataProperties: [textProp('description'), imageProp('photo')],
        languages,
        currentLanguage: 'en',
      })
    ).toEqual({
      es: {
        title: [{ value: 'Audiencia' }],
        description: [{ value: '' }],
        photo: [{ value: '/es.jpg' }],
      },
    });
  });

  it('keeps a touched empty translation instead of copying the current language', () => {
    expect(
      buildTranslationsForSave({
        values: values({
          translations: {
            es: {
              title: [{ value: '' }],
              description: [{ value: '' }],
              photo: [],
            },
          },
          touchedTranslations: { es: { title: true, description: true, photo: true } },
        }),
        metadataProperties: [textProp('description'), imageProp('photo')],
        languages,
        currentLanguage: 'en',
      })
    ).toEqual({
      es: {
        title: [{ value: '' }],
        description: [{ value: '' }],
        photo: [],
      },
    });
  });

  it('fills a blank title from the current language so required titles can save', () => {
    expect(
      buildTranslationsForSave({
        values: values({ translations: { es: { title: [{ value: '' }] } } }),
        metadataProperties: [textProp('description')],
        languages,
        currentLanguage: 'en',
      })
    ).toEqual({
      es: {
        title: [{ value: 'Hearing' }],
        description: [{ value: 'Summary' }],
      },
    });
  });
});

describe('setTranslationText', () => {
  it('writes a string property into a language bucket', () => {
    expect(
      setTranslationText({
        translations: {},
        language: 'es',
        propertyName: 'title',
        value: 'Audiencia',
      })
    ).toEqual({
      es: { title: [{ value: 'Audiencia' }] },
    });
  });
});
