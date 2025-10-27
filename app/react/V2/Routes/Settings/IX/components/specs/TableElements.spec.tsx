/**
 * @jest-environment jsdom
 */
import { TableSuggestion } from '../../types';
import { calculateOptimalProportions } from '../../helpers/contextHelpers';

describe('CalculateOptimalProportions', () => {
  it('should have default column widths', () => {
    const suggestions: TableSuggestion[] = [
      {
        entityTitle: 'Standard Document Title',
        segment: 'Standard Context',
        currentValue: 'Standard Value',
        suggestedValue: 'Standard Suggestion',
      } as TableSuggestion,
    ];

    const result = calculateOptimalProportions(suggestions);

    expect(result.titleWidth).toBe('w-1/4');
    expect(result.contextWidth).toBe('w-1/4');
    expect(result.valueWidth).toBe('w-1/2 min-w-[200px]');
  });

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
  it('should give more space to long context', () => {
    const suggestions: TableSuggestion[] = [
      {
        entityTitle: 'Document',
        segment: 'A'.repeat(300), // Very long context
        currentValue: 'Value',
        suggestedValue: 'Suggestion',
      } as TableSuggestion,
    ];

    const result = calculateOptimalProportions(suggestions);

    expect(result.titleWidth).toBe('w-1/4');
    expect(result.contextWidth).toBe('w-1/2 min-w-[200px]');
    expect(result.valueWidth).toBe('w-1/4');
  });
});
