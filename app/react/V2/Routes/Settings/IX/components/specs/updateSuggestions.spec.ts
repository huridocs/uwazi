import { updateSuggestions } from '../helpers';
import { suggestion1, suggestion2, suggestion3, suggestion4 } from './fixtures';

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
});
