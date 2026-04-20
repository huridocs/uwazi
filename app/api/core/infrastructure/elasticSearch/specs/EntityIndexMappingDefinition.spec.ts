import { elasticLanguageCodes } from '#shared/language/index.js';
import { EntityIndexMappingDefinition } from '../entities/EntityIndexMappingDefinition.js';

const { settings, mappings } = EntityIndexMappingDefinition;
const { analysis } = settings as any;
const { properties } = mappings as any;

describe('EntityIndexMappingDefinition', () => {
  describe('settings.analysis', () => {
    it('contains a stop filter for every elastic language', () => {
      elasticLanguageCodes.forEach(lang => {
        expect(analysis.filter[`${lang}_stop`]).toEqual({ type: 'stop', stopwords: `_${lang}_` });
      });
    });

    it('contains a stemmer filter for languages that support it', () => {
      const noStemmer = ['persian', 'thai', 'cjk'];
      elasticLanguageCodes.forEach(lang => {
        if (noStemmer.includes(lang)) {
          expect(analysis.filter[`${lang}_stemmer`]).toBeUndefined();
        } else {
          expect(analysis.filter[`${lang}_stemmer`]).toEqual({ type: 'stemmer', language: lang });
        }
      });
    });

    it('contains a fulltext_* analyzer for every elastic language', () => {
      elasticLanguageCodes.forEach(lang => {
        const analyzer = analysis.analyzer[`fulltext_${lang}`];
        expect(analyzer).toBeDefined();
        expect(analyzer.type).toBe('custom');
        expect(analyzer.filter).toContain('lowercase');
        expect(analyzer.filter).toContain('asciifolding');
      });
    });

    it('contains a stop_* analyzer for every elastic language', () => {
      elasticLanguageCodes.forEach(lang => {
        const analyzer = analysis.analyzer[`stop_${lang}`];
        expect(analyzer).toBeDefined();
        expect(analyzer.filter).toContain(`${lang}_stop`);
      });
    });

    it('includes arabic_normalization in arabic analyzers', () => {
      expect(analysis.analyzer.fulltext_arabic.filter).toContain('arabic_normalization');
      expect(analysis.analyzer.stop_arabic.filter).toContain('arabic_normalization');
    });

    it('includes arabic_normalization and persian_normalization in persian analyzers', () => {
      expect(analysis.analyzer.fulltext_persian.filter).toContain('arabic_normalization');
      expect(analysis.analyzer.fulltext_persian.filter).toContain('persian_normalization');
    });

    it('does not include a stemmer filter in cjk analyzers', () => {
      expect(analysis.analyzer.fulltext_cjk.filter).not.toContain('cjk_stemmer');
      expect(analysis.analyzer.stop_cjk.filter).not.toContain('cjk_stemmer');
    });

    it('does not generate a fulltext_other analyzer (uses the existing other analyzer)', () => {
      expect(analysis.analyzer.fulltext_other).toBeUndefined();
    });
  });

  describe('mappings.properties', () => {
    it('declares fullText_* for every elastic language with correct analyzer references', () => {
      elasticLanguageCodes.forEach(lang => {
        const field = properties[`fullText_${lang}`];
        expect(field).toBeDefined();
        expect(field.type).toBe('text');
        expect(field.analyzer).toBe(`fulltext_${lang}`);
        expect(field.search_analyzer).toBe(`stop_${lang}`);
        expect(field.search_quote_analyzer).toBe(`fulltext_${lang}`);
        expect(field.term_vector).toBe('with_positions_offsets');
      });
    });

    it('declares fullText_other using the other analyzer', () => {
      expect(properties.fullText_other).toEqual({
        type: 'text',
        analyzer: 'other',
        term_vector: 'with_positions_offsets',
      });
    });

    it('declares fileId as keyword', () => {
      expect(properties.fileId).toEqual({ type: 'keyword' });
    });
  });
});
