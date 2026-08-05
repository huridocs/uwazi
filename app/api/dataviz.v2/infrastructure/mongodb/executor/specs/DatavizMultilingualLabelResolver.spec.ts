import { TranslationCollection } from '#api/i18n.v2/model/TranslationCollection.js';
import { Translation } from '#api/i18n.v2/model/Translation.js';
import {
  buildMissingBucketLabels,
  createMultilingualLabelResolver,
  resolveSeriesLocalizedLabels,
  type DatavizMultilingualLabelContext,
} from '../DatavizMultilingualLabelResolver.js';

const buildContext = (
  overrides: Partial<DatavizMultilingualLabelContext> = {}
): DatavizMultilingualLabelContext => ({
  languages: ['en', 'es'],
  defaultLanguage: 'en',
  templateNames: new Map([['tpl-a', 'Cars']]),
  templateTranslations: new Map([
    [
      'tpl-a',
      new TranslationCollection([
        new Translation('Cars', 'Cars', 'en', { type: 'Entity', label: 'Cars', id: 'tpl-a' }),
        new Translation('Cars', 'Autos', 'es', { type: 'Entity', label: 'Cars', id: 'tpl-a' }),
      ]),
    ],
  ]),
  propertyThesaurus: new Map([
    [
      'color',
      {
        valueLabels: new Map([['color-id', 'Red']]),
        translations: new TranslationCollection([
          new Translation('Red', 'Red', 'en', { type: 'Thesaurus', label: 'Colors', id: 'th-1' }),
          new Translation('Red', 'Rojo', 'es', { type: 'Thesaurus', label: 'Colors', id: 'th-1' }),
        ]),
      },
    ],
  ]),
  relatedEntityProperties: new Set(['garage']),
  entityTitles: new Map([['owner-1', { en: 'Alice', es: 'Alicia' }]]),
  missingBucketLabels: buildMissingBucketLabels(['en', 'es']),
  ...overrides,
});

describe('DatavizMultilingualLabelResolver', () => {
  it('should resolve thesaurus labels per language', () => {
    const resolve = createMultilingualLabelResolver(buildContext());

    expect(resolve({ property: 'color', propertyType: 'select' }, 'color-id')).toEqual({
      en: 'Red',
      es: 'Rojo',
    });
  });

  it('should resolve related entity titles per language', () => {
    const resolve = createMultilingualLabelResolver(buildContext());

    expect(
      resolve(
        { property: 'garage', propertyType: 'select', relationshipMode: 'related_entity' },
        'owner-1'
      )
    ).toEqual({
      en: 'Alice',
      es: 'Alicia',
    });
  });

  it('should resolve compare series labels from template translations', () => {
    const labels = resolveSeriesLocalizedLabels('tpl-a', undefined, 1, buildContext());

    expect(labels).toEqual({ en: 'Cars', es: 'Autos' });
  });
});
