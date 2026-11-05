import { resolveFileTabFooterMode } from '../fileTabFooterMode.js';

describe('resolveFileTabFooterMode', () => {
  it('returns empty while editing a file', () => {
    expect(
      resolveFileTabFooterMode({
        isEditing: true,
        isMulti: true,
        hasFocusedRow: true,
      })
    ).toBe('empty');
  });

  it('returns multi when several files are selected', () => {
    expect(
      resolveFileTabFooterMode({
        isEditing: false,
        isMulti: true,
        hasFocusedRow: true,
      })
    ).toBe('multi');
  });

  it('uses focused footer for a single focused row', () => {
    expect(
      resolveFileTabFooterMode({
        isEditing: false,
        isMulti: false,
        hasFocusedRow: true,
      })
    ).toBe('focused');
  });
});
