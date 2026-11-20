import { keepMetadataAttributes, reuseSelectedEntries } from '../keepMetadataAttributes.js';

describe('keepMetadataAttributes', () => {
  it('keeps attributes on the same slots when the row count stays the same', () => {
    expect(
      keepMetadataAttributes(
        [{ value: { child: ['old'] }, attributes: ['ai_generated'] }],
        [{ value: { child: ['new'] } }]
      )
    ).toEqual([{ value: { child: ['new'] }, attributes: ['ai_generated'] }]);
  });

  it('does not copy attributes onto a shorter list by value', () => {
    expect(
      keepMetadataAttributes(
        [
          { value: 'a', attributes: ['ai_generated'] },
          { value: 'b', attributes: ['sync_off'] },
        ],
        [{ value: 'b' }]
      )
    ).toEqual([{ value: 'b' }]);
  });
});

describe('reuseSelectedEntries', () => {
  it('does not keep attributes when the selected value changes', () => {
    expect(
      reuseSelectedEntries(
        [{ value: 'old', attributes: ['ai_generated', 'sync_off'] }],
        [{ value: 'new', label: 'New' }]
      )
    ).toEqual([{ value: 'new', label: 'New' }]);
  });

  it('keeps attributes on a value that is still selected', () => {
    expect(
      reuseSelectedEntries(
        [
          { value: 'a', attributes: ['ai_generated'] },
          { value: 'b', attributes: ['sync_off'] },
        ],
        [
          { value: 'b', label: 'B' },
          { value: 'c', label: 'C' },
        ]
      )
    ).toEqual([
      { value: 'b', label: 'B', attributes: ['sync_off'] },
      { value: 'c', label: 'C' },
    ]);
  });

  it('does not give one entry the attributes of another entry with the same value', () => {
    expect(
      reuseSelectedEntries(
        [{ value: 'a', attributes: ['ai_generated'] }, { value: 'a' }],
        [{ value: 'a', label: 'Second' }]
      )
    ).toEqual([{ value: 'a', label: 'Second' }]);
  });
});
