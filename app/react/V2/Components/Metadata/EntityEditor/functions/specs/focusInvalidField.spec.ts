/**
 * @jest-environment jsdom
 */
import {
  escapeCssAttributeValue,
  findFirstErrorPath,
  focusAndScrollToInvalidField,
} from '../focusInvalidField.js';

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

  it('focuses the url input when the link value path also matches the label', () => {
    document.body.innerHTML =
      '<input id="metadata.link.0.value.label" /><input id="metadata.link.0.value.url" />';
    const url = document.getElementById('metadata.link.0.value.url');
    const focus = jest.spyOn(url as HTMLElement, 'focus');

    focusAndScrollToInvalidField('metadata.link.0.value');

    expect(focus).toHaveBeenCalled();
  });
});
