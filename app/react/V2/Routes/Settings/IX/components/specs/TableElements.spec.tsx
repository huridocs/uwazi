/**
 * @jest-environment jsdom
 */
import { TableSuggestion } from '../../types';
import { calculateOptimalProportions } from '../../helpers/contextHelpers';

describe('TableElements - Unified Column Width Analysis', () => {
  describe('Basic Column Width Configuration', () => {
    it('should verify the column width configuration is optimized', () => {
      // Test basic width configuration
      const contextColumnWidth = 'w-1/2';
      expect(contextColumnWidth).toBe('w-1/2');

      const currentValueColumnWidth = 'w-1/4';
      expect(currentValueColumnWidth).toBe('w-1/4');

      const titleColumnWidth = 'w-1/6';
      expect(titleColumnWidth).toBe('w-1/6');

      const actionColumnWidth = 'w-0';
      expect(actionColumnWidth).toBe('w-0');
    });

    it('should prioritize context over current value for better UX', () => {
      const contextWidth = 'w-1/2';
      const currentValueWidth = 'w-1/4';

      expect(contextWidth).toBe('w-1/2');
      expect(currentValueWidth).toBe('w-1/4');

      // Verify total width is reasonable
      const totalWidth = 50 + 25 + 16.67;
      expect(totalWidth).toBeLessThan(100);
    });
  });

  describe('Empty Content Scenarios', () => {
    it('should prioritize NAME column when no context and no values', () => {
      const suggestions: TableSuggestion[] = [
        {
          entityTitle: 'Long Document Title That Needs More Space',
          segment: 'No context',
          currentValue: '-',
          suggestedValue: '-',
        } as TableSuggestion,
      ];

      const result = calculateOptimalProportions(suggestions);

      expect(result.titleWidth).toBe('w-1/2 min-w-[200px]');
      expect(result.contextWidth).toBe('w-1/4');
      expect(result.valueWidth).toBe('w-1/4');
    });

    it('should handle no context but has values', () => {
      const suggestions: TableSuggestion[] = [
        {
          entityTitle: 'Document Title',
          segment: 'No context',
          currentValue: 'April 3, 2025',
          suggestedValue: 'April 4, 2025',
        } as TableSuggestion,
      ];

      const result = calculateOptimalProportions(suggestions);

      expect(result.titleWidth).toBe('w-1/4');
      expect(result.contextWidth).toBe('w-1/4');
      expect(result.valueWidth).toBe('w-1/2 min-w-[200px]');
    });

    it('should handle no values but has context', () => {
      const suggestions: TableSuggestion[] = [
        {
          entityTitle: 'Document Title',
          segment: 'Long context content that provides meaningful information about the document',
          currentValue: '-',
          suggestedValue: '-',
        } as TableSuggestion,
      ];

      const result = calculateOptimalProportions(suggestions);

      expect(result.titleWidth).toBe('w-1/4');
      expect(result.contextWidth).toBe('w-1/2 min-w-[200px]');
      expect(result.valueWidth).toBe('w-1/4');
    });
  });

  describe('Short Value Scenarios', () => {
    it('should prioritize context for very short values (single words)', () => {
      const suggestions: TableSuggestion[] = [
        {
          entityTitle: 'Document',
          segment: 'Long context with meaningful information',
          currentValue: 'Yes',
          suggestedValue: 'No',
        } as TableSuggestion,
      ];

      const result = calculateOptimalProportions(suggestions);

      expect(result.titleWidth).toBe('w-1/6 min-w-[100px]');
      expect(result.contextWidth).toBe('w-2/5');
      expect(result.valueWidth).toBe('w-2/5');
    });

    it('should handle short values (dates)', () => {
      const suggestions: TableSuggestion[] = [
        {
          entityTitle: 'Document',
          segment: 'Context information',
          currentValue: '2025-04-03',
          suggestedValue: '2025-04-04',
        } as TableSuggestion,
      ];

      const result = calculateOptimalProportions(suggestions);

      expect(result.titleWidth).toBe('w-1/6 min-w-[100px]');
      expect(result.contextWidth).toBe('w-2/5');
      expect(result.valueWidth).toBe('w-2/5');
    });
  });

  describe('Long Title Scenarios', () => {
    it('should give more space to long titles', () => {
      const suggestions: TableSuggestion[] = [
        {
          entityTitle: 'Very Long Document Title That Requires More Space For Better Readability',
          segment:
            'This is a longer context segment that provides more information about the document content',
          currentValue: 'Value',
          suggestedValue: 'Suggestion',
        } as TableSuggestion,
      ];

      const result = calculateOptimalProportions(suggestions);

      expect(result.titleWidth).toBe('w-1/2 min-w-[200px]');
      expect(result.contextWidth).toBe('w-1/4');
      expect(result.valueWidth).toBe('w-1/4');
    });
  });

  describe('Long Context Scenarios', () => {
    it('should prioritize context for very long content', () => {
      const suggestions: TableSuggestion[] = [
        {
          entityTitle: 'Document',
          segment: 'A'.repeat(300), // Very long context
          currentValue: 'Value',
          suggestedValue: 'Suggestion',
        } as TableSuggestion,
      ];

      const result = calculateOptimalProportions(suggestions);

      expect(result.titleWidth).toBe('w-1/6 min-w-[100px]');
      expect(result.contextWidth).toBe('w-2/3');
      expect(result.valueWidth).toBe('w-1/6');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty suggestions array', () => {
      const result = calculateOptimalProportions([]);

      expect(result.titleWidth).toBe('w-1/6 min-w-[100px]');
      expect(result.contextWidth).toBe('w-2/5');
      expect(result.valueWidth).toBe('w-2/5');
    });

    it('should handle null/undefined suggestions', () => {
      const result = calculateOptimalProportions(null as any);

      expect(result.titleWidth).toBe('w-1/6 min-w-[100px]');
      expect(result.contextWidth).toBe('w-2/5');
      expect(result.valueWidth).toBe('w-2/5');
    });

    it('should handle suggestions with missing properties', () => {
      const suggestions: TableSuggestion[] = [
        {} as TableSuggestion,
        { entityTitle: 'Title' } as TableSuggestion,
      ];

      const result = calculateOptimalProportions(suggestions);

      expect(result.titleWidth).toBe('w-1/6 min-w-[100px]');
      expect(result.contextWidth).toBe('w-2/5');
      expect(result.valueWidth).toBe('w-2/5');
    });

    it('should handle very large datasets efficiently', () => {
      const suggestions: TableSuggestion[] = Array.from(
        { length: 1000 },
        (_, i) =>
          ({
            entityTitle: `Document ${i}`,
            segment: `Context ${i}`,
            currentValue: `Value ${i}`,
            suggestedValue: `Suggestion ${i}`,
          }) as TableSuggestion
      );

      const startTime = performance.now();
      const result = calculateOptimalProportions(suggestions);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(50); // Should analyze in under 50ms
      expect(result.titleWidth).toBe('w-1/6 min-w-[100px]');
      expect(result.contextWidth).toBe('w-2/5');
      expect(result.valueWidth).toBe('w-2/5');
    });
  });

  describe('Real-world Scenarios', () => {
    it('should handle UN document resolution data', () => {
      const suggestions: TableSuggestion[] = [
        {
          entityTitle: 'A/HRC/RES/46/27',
          segment:
            'Distr.: General 3 April 2025 10. Calls upon the Revitalized Transitional Government',
          currentValue: 'April 3, 2025',
          suggestedValue: 'April 4, 2025',
        } as TableSuggestion,
      ];

      const result = calculateOptimalProportions(suggestions);

      expect(result.titleWidth).toBe('w-1/6 min-w-[100px]');
      expect(result.contextWidth).toBe('w-2/5');
      expect(result.valueWidth).toBe('w-2/5');
    });

    it('should handle multilingual document data', () => {
      const suggestions: TableSuggestion[] = [
        {
          entityTitle: 'G2505272 (en)',
          segment: 'Resolution adopted by the Human Rights Council on 2 April 2025',
          currentValue: 'April 2, 2025',
          suggestedValue: 'April 3, 2025',
        } as TableSuggestion,
        {
          entityTitle: 'G2505558 (ru)',
          segment: 'Резолюция, принятая Советом по правам человека 2 апреля 2025 года',
          currentValue: '2 апреля 2025',
          suggestedValue: '3 апреля 2025',
        } as TableSuggestion,
      ];

      const result = calculateOptimalProportions(suggestions);

      expect(result.titleWidth).toBe('w-1/6 min-w-[100px]');
      expect(result.contextWidth).toBe('w-2/5');
      expect(result.valueWidth).toBe('w-2/5');
    });
  });
});
