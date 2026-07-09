import {
  markdownFromMetadataValues,
  metadataValuesFromMarkdown,
  nestedFieldHasValue,
} from '../nestedFieldUtils.js';

describe('nestedFieldUtils', () => {
  it('should round-trip nested metadata through markdown table syntax', () => {
    const values = [
      { value: { prop1: ['1', '2'], prop2: ['1', '2'] } },
      { value: { prop1: ['2.1', '3'], prop2: ['2'] } },
    ];

    const markdown = markdownFromMetadataValues(values);
    expect(markdown).toBe('| prop1 | prop2 |\n| - | - |\n| 1,2 | 1,2 |\n| 2.1,3 | 2 |');

    expect(metadataValuesFromMarkdown(markdown)).toEqual(values);
  });

  it('should detect when a nested field has content', () => {
    expect(nestedFieldHasValue([])).toBe(false);
    expect(nestedFieldHasValue([{ value: { prop1: [], prop2: [] } }])).toBe(false);
    expect(nestedFieldHasValue([{ value: { prop1: ['1'], prop2: [] } }])).toBe(true);
  });
});
