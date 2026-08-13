import { prepareContexts, toIndexedTranslations } from '../LegacyTranslationDtoMapper.js';
import { TranslationContext } from '#shared/translationType.js';

describe('LegacyTranslationDtoMapper', () => {
  describe('prepareContexts()', () => {
    it('should index values by key and coerce System/Filters/Menu to Uwazi UI', () => {
      const contexts: TranslationContext[] = [
        {
          id: 'System',
          label: 'User Interface',
          type: 'Entity',
          values: [
            { key: 'Search', value: 'Search' },
            { key: 'Empty', value: '' },
          ],
        },
        {
          id: 'thesaurus-1',
          label: 'Places',
          type: 'Thesaurus',
          values: [{ key: 'City', value: 'City' }],
        },
      ];

      expect(prepareContexts(contexts)).toEqual([
        {
          id: 'System',
          label: 'User Interface',
          type: 'Uwazi UI',
          values: { Search: 'Search' },
        },
        {
          id: 'thesaurus-1',
          label: 'Places',
          type: 'Thesaurus',
          values: { City: 'City' },
        },
      ]);
    });

    it('should index a large context in linear time', () => {
      const size = 8000;
      const values = Array.from({ length: size }, (_, i) => ({
        key: `key-${i}`,
        value: `value-${i}`,
      }));
      const contexts: TranslationContext[] = [
        { id: 'big-thesaurus', label: 'CPV', type: 'Thesaurus', values },
      ];

      const start = process.hrtime.bigint();
      const [indexed] = prepareContexts(contexts);
      const elapsedMs = Number(process.hrtime.bigint() - start) / 1e6;

      expect(Object.keys(indexed.values)).toHaveLength(size);
      expect(indexed.values['key-0']).toBe('value-0');
      expect(indexed.values[`key-${size - 1}`]).toBe(`value-${size - 1}`);
      // Object-spread-per-key was ~16s for ~9k keys; assignment must stay in the millisecond range.
      expect(elapsedMs).toBeLessThan(200);
    });
  });

  describe('toIndexedTranslations()', () => {
    it('should prepare contexts on each locale document', () => {
      const [indexed] = toIndexedTranslations([
        {
          locale: 'en',
          contexts: [
            {
              id: 'System',
              label: 'User Interface',
              type: 'Uwazi UI',
              values: [{ key: 'Search', value: 'Search' }],
            },
          ],
        } as any,
      ]);

      expect(indexed.contexts?.[0].values).toEqual({ Search: 'Search' });
    });
  });
});
