import { resolveFileTabFooterMode } from '../fileTabFooterMode.js';

describe('resolveFileTabFooterMode', () => {
  it('returns empty while editing even with multi and focused', () => {
    expect(
      resolveFileTabFooterMode({
        isEditing: true,
        isMulti: true,
        hasFocusedRow: true,
        filePanelMode: 'details',
      })
    ).toBe('empty');
  });

  it('keeps focused chrome for preview under multi-select', () => {
    expect(
      resolveFileTabFooterMode({
        isEditing: false,
        isMulti: true,
        hasFocusedRow: true,
        filePanelMode: 'preview',
      })
    ).toBe('focused');
  });

  it('uses multi footer for details under multi-select', () => {
    expect(
      resolveFileTabFooterMode({
        isEditing: false,
        isMulti: true,
        hasFocusedRow: true,
        filePanelMode: 'details',
      })
    ).toBe('multi');
  });

  it('uses focused footer for a single focused row', () => {
    expect(
      resolveFileTabFooterMode({
        isEditing: false,
        isMulti: false,
        hasFocusedRow: true,
        filePanelMode: 'details',
      })
    ).toBe('focused');
  });
});
