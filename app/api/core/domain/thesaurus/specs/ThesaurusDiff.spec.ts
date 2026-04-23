import { Thesaurus } from '../Thesaurus.js';
import { ThesaurusDiff } from '../ThesaurusDiff.js';

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

  it('hasChanges should return true if there are changes', () => {
    const before = Thesaurus.create({
      name: 'Colors',
      values: [{ label: 'Red' }, { label: 'Blue' }],
    });

    const after = before.update({
      values: [{ ...before.values[0], label: 'Red Updated' }, { label: 'Green' }],
    });

    const diffWithChanges = new ThesaurusDiff({ before, after });
    const diffWithNoChanges = new ThesaurusDiff({ before, after: before });

    expect(diffWithChanges.hasChanges).toBe(true);
    expect(diffWithNoChanges.hasChanges).toBe(false);
  });

  it('hasOrderChanges should detect root-only order changes', () => {
    const before = Thesaurus.create({
      name: 'Countries',
      values: [
        { label: 'USA' },
        { label: 'Canada' },
        { label: 'Mexico' },
        {
          label: 'Europe',
          values: [{ label: 'France' }, { label: 'Germany' }],
        },
      ],
    });

    const after = before.update({
      values: [before.values[1], before.values[0], before.values[2], before.values[3]],
    });

    const diff = new ThesaurusDiff({ before, after });

    expect(diff.hasChanges).toBe(false);
    expect(diff.hasOrderChanges).toBe(true);
  });

  it('hasOrderChanges should detect children-only order changes across two groups', () => {
    const before = Thesaurus.create({
      name: 'Regions',
      values: [
        {
          label: 'Europe',
          values: [{ label: 'France' }, { label: 'Germany' }, { label: 'Spain' }],
        },
        {
          label: 'Asia',
          values: [{ label: 'Japan' }, { label: 'China' }, { label: 'India' }],
        },
        {
          label: 'Africa',
          values: [{ label: 'Kenya' }, { label: 'Ghana' }, { label: 'Nigeria' }],
        },
      ],
    });

    const after = before.update({
      values: [
        {
          ...before.values[0],
          values: [
            before.values[0].values![2],
            before.values[0].values![0],
            before.values[0].values![1],
          ],
        },
        {
          ...before.values[1],
          values: [
            before.values[1].values![1],
            before.values[1].values![2],
            before.values[1].values![0],
          ],
        },
        {
          ...before.values[2],
          values: [...before.values[2].values!],
        },
      ],
    });

    const diff = new ThesaurusDiff({ before, after });

    expect(after.values.map(value => value.id)).toEqual(before.values.map(value => value.id));
    expect(diff.hasChanges).toBe(false);
    expect(diff.hasOrderChanges).toBe(true);
  });

  it('hasOrderChanges should detect combined root and children order changes', () => {
    const before = Thesaurus.create({
      name: 'Regions',
      values: [
        { label: 'USA' },
        {
          label: 'Europe',
          values: [{ label: 'France' }, { label: 'Germany' }, { label: 'Spain' }],
        },
        {
          label: 'Asia',
          values: [{ label: 'Japan' }, { label: 'China' }, { label: 'India' }],
        },
        {
          label: 'Africa',
          values: [{ label: 'Kenya' }, { label: 'Ghana' }, { label: 'Nigeria' }],
        },
      ],
    });

    const after = before.update({
      values: [
        {
          ...before.values[3],
          values: [
            before.values[3].values![2],
            before.values[3].values![0],
            before.values[3].values![1],
          ],
        },
        before.values[0],
        {
          ...before.values[1],
          values: [
            before.values[1].values![1],
            before.values[1].values![2],
            before.values[1].values![0],
          ],
        },
        {
          ...before.values[2],
          values: [...before.values[2].values!],
        },
      ],
    });

    const diff = new ThesaurusDiff({ before, after });

    expect(diff.hasChanges).toBe(false);
    expect(diff.hasOrderChanges).toBe(true);
  });
});
