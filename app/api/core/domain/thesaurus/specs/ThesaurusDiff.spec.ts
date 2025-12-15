import { Thesaurus } from '../Thesaurus';
import { ThesaurusDiff } from '../ThesaurusDiff';

describe('ThesaurusDiff', () => {
  it('should compute diff', () => {
    const before = Thesaurus.create({
      name: 'Countries',
      values: [
        { label: 'USA' },
        { label: 'Canada' },
        {
          label: 'Europe',
          values: [{ label: 'France' }],
        },
        {
          label: 'Asia',
          values: [{ label: 'France' }],
        },
      ],
    });

    const after = before.update({
      values: [
        { ...before.values[0], label: 'USA Update' },
        { label: 'Brazil' },
        {
          ...before.values[2],
          label: 'Europe Updated',
          values: [
            { ...before.values[2].values![0], label: 'France Updated' },
            { label: 'Germany' },
          ],
        },
      ],
    });

    const diff = new ThesaurusDiff({ before, after });

    expect(diff.addedValues).toEqual([
      { id: after.values[1].id, label: 'Brazil' },
      { id: after.values[2].values![1].id, label: 'Germany' },
    ]);

    expect(diff.removedValues).toEqual([
      { id: before.values[1].id, label: 'Canada' },
      { id: before.values[3].id, label: 'Asia' },
      { id: before.values[3].values![0].id, label: 'France' },
    ]);

    expect(diff.updatedValues).toEqual([
      { id: after.values[0].id, label: 'USA Update' },
      { id: after.values[2].id, label: 'Europe Updated' },
      { id: after.values[2].values![0].id, label: 'France Updated' },
    ]);
  });
});
