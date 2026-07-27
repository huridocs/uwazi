import { escapeCssAttributeValue, findFirstErrorPath } from '../focusInvalidField.js';

describe('focusInvalidField', () => {
  it('should escape CSS attribute special characters', () => {
    expect(escapeCssAttributeValue('a"b\\c')).toBe('a\\"b\\\\c');
  });

  it('should return the first leaf field error path', () => {
    expect(
      findFirstErrorPath({
        title: { type: 'required', message: 'Required' },
        metadata: {
          simple_text: {
            0: { value: { type: 'required', message: 'Required' } },
          },
        },
      })
    ).toBe('title');
  });

  it('should walk nested metadata errors when scalars are clean', () => {
    expect(
      findFirstErrorPath({
        metadata: {
          simple_text: {
            0: { value: { type: 'required', message: 'Required' } },
          },
        },
      })
    ).toBe('metadata.simple_text.0.value');
  });
});
