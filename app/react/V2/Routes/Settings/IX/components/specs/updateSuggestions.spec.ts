import { updateSuggestions } from '../helpers';
import { suggestion1, suggestion2, suggestion3, suggestion4, suggestion5 } from './fixtures';

describe('updateSuggestions', () => {
  beforeAll(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  it('should update existing suggestions making them accepted', () => {
    const accepted = updateSuggestions([suggestion1, suggestion2], [suggestion1]);
    expect(accepted).toEqual([
      {
        ...suggestion1,
        state: { ...suggestion1.state, match: true },
        currentValue: 'suggested value',
        entityTitle: 'suggested value',
      },
      suggestion2,
    ]);
  });

  it('should work with properties other than title', () => {
    const accepted = updateSuggestions([suggestion3, suggestion4], [suggestion4]);
    expect(accepted).toEqual([
      suggestion3,
      {
        ...suggestion4,
        state: { ...suggestion4.state, match: true },
        currentValue: 500,
        entityTitle: 'Entity 5',
      },
    ]);
  });

  it('should work with multi value suggestions', () => {
    const accepted = updateSuggestions([suggestion3, suggestion5], [suggestion5.children[0]]);
    expect(accepted).toEqual([
      suggestion3,
      {
        ...suggestion5,
        state: { ...suggestion5.state, match: false },
        currentValue: ['value1', 'value2', 'value3'],
        children: [
          {
            ...suggestion5.children[0],
            currentValue: 'value3',
          },
          suggestion5.children[1],
          suggestion5.children[2],
        ],
      },
    ]);
  });

  it('should work with multi value suggestions removing values', () => {
    const accepted = updateSuggestions([suggestion3, suggestion5], [suggestion5.children[2]]);
    expect(accepted).toEqual([
      suggestion3,
      {
        ...suggestion5,
        state: { ...suggestion5.state, match: true },
        currentValue: ['value2'],
        children: [suggestion5.children[0], suggestion5.children[1]],
      },
    ]);
  });
});
