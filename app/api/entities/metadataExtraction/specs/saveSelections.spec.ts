import { checkSelections } from '../saveSelections';

describe('checkSelections', () => {
  let newSelections = [];
  let savedSelections = {};
  let entity = {};

  it('should merge new selections with selections stored in the file', () => {
    newSelections = [
      { label: 'Property A', selection: { text: 'text of prop A' } },
      { label: 'Property C', selection: { text: 'text of prop C' } },
    ];
    savedSelections = {
      extractedMetadata: [
        { label: 'Property A', selection: { text: 'text of prop A' } },
        { label: 'Property B', selection: { text: 'text of prop B' } },
      ],
    };
    entity = {};

    const result = checkSelections(newSelections, savedSelections, entity);
    expect(result).toBe([
      { label: 'Property A', selection: { text: 'text of prop A' } },
      { label: 'Property B', selection: { text: 'text of prop B' } },
      { label: 'Property C', selection: { text: 'text of prop C' } },
    ]);
  });
});
