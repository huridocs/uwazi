import { Thesaurus } from '../Thesaurus.js';

describe('Thesaurus', () => {
  it('should create a new thesaurus', () => {
    const thesaurus = Thesaurus.create({
      name: 'Countries',
      values: [
        { label: 'USA' },
        { label: 'Europe', values: [{ label: 'France' }, { label: 'Germany' }] },
      ],
    });

    expect(thesaurus).toEqual({
      id: expect.any(String),
      name: 'Countries',
      values: [
        { id: expect.any(String), label: 'USA' },
        {
          id: expect.any(String),
          label: 'Europe',
          values: [
            { id: expect.any(String), label: 'France' },
            { id: expect.any(String), label: 'Germany' },
          ],
        },
      ],

      hashedValuesById: expect.any(Object),
      hashedValuesByLabel: expect.any(Object),
    });
  });

  it('should set fallback for values when not provided', () => {
    const thesaurus = Thesaurus.create({
      name: 'Countries',
    });

    expect(thesaurus).toEqual({
      id: expect.any(String),
      name: 'Countries',
      values: [],
      hashedValuesById: expect.any(Object),
      hashedValuesByLabel: expect.any(Object),
    });
  });

  it('should trim labels', () => {
    const thesaurus = Thesaurus.create({
      name: '  Countries  ',
      values: [
        { label: '  USA  ' },
        { label: 'Brazil', values: [{ label: '  Rio de Janeiro  ' }] },
      ],
    });

    expect(thesaurus).toEqual({
      id: expect.any(String),
      name: 'Countries',
      values: [
        { id: expect.any(String), label: 'USA' },
        {
          id: expect.any(String),
          label: 'Brazil',
          values: [{ id: expect.any(String), label: 'Rio de Janeiro' }],
        },
      ],
      hashedValuesById: expect.any(Object),
      hashedValuesByLabel: expect.any(Object),
    });
  });

  describe('required fields', () => {
    it('should require name', () => {
      expect(
        () =>
          new Thesaurus({
            id: '123',
            name: '',
            values: [],
          })
      ).toThrow('Name cannot be empty');
    });

    it('should require label in values', () => {
      expect(() =>
        Thesaurus.create({
          name: 'Test',
          values: [{ label: '' }],
        })
      ).toThrow('Label cannot be empty');
    });

    it('should require label in nested values', () => {
      expect(() =>
        Thesaurus.create({
          name: 'Test',
          values: [{ label: 'Parent', values: [{ label: '' }] }],
        })
      ).toThrow('Label cannot be empty');
    });
  });

  describe('duplicate labels', () => {
    it('should prevent duplicate labels at root level', () => {
      expect(() =>
        Thesaurus.create({
          name: 'Countries',
          values: [{ label: 'USA' }, { label: 'USA' }],
        })
      ).toThrow();
    });

    it('should prevent duplicate labels within a group', () => {
      expect(() =>
        Thesaurus.create({
          name: 'Countries',
          values: [
            {
              label: 'Europe',
              values: [{ label: 'France' }, { label: 'France' }],
            },
          ],
        })
      ).toThrow();
    });

    it('should allow same label in different groups', () => {
      expect(() =>
        Thesaurus.create({
          name: 'Countries',
          values: [
            {
              label: 'Europe',
              values: [{ label: 'Test' }],
            },
            {
              label: 'Asia',
              values: [{ label: 'Test' }],
            },
          ],
        })
      ).not.toThrow();
    });

    it('should detect multiple duplicate labels', () => {
      expect(() =>
        Thesaurus.create({
          name: 'Test',
          values: [{ label: 'A' }, { label: 'B' }, { label: 'A' }, { label: 'B' }],
        })
      ).toThrow();
    });

    it('should detect duplicates in both root and nested levels', () => {
      expect(() =>
        Thesaurus.create({
          name: 'Test',
          values: [
            { label: 'Root1' },
            { label: 'Root1' },
            {
              label: 'Group',
              values: [{ label: 'Child1' }, { label: 'Child1' }],
            },
          ],
        })
      ).toThrow();
    });
  });

  describe('addValues', () => {
    it('should add new root values to the thesaurus', () => {
      const thesaurus = Thesaurus.create({
        name: 'Countries',
        values: [{ label: 'USA' }],
      });

      const updated = thesaurus.addValues([{ label: 'Canada' }, { label: 'Mexico' }]);

      expect(updated).toEqual({
        id: expect.any(String),
        name: 'Countries',
        values: [
          { id: expect.any(String), label: 'USA' },
          { id: expect.any(String), label: 'Canada' },
          { id: expect.any(String), label: 'Mexico' },
        ],
        hashedValuesById: expect.any(Object),
        hashedValuesByLabel: expect.any(Object),
        before: expect.any(Object),
      });
    });

    it('should add new nested values to existing groups', () => {
      const thesaurus = Thesaurus.create({
        name: 'Countries',
        values: [
          { label: 'Asia', values: [{ label: 'China' }] },
          { label: 'Europe', values: [{ label: 'Italy' }] },
          { label: 'USA' },
          { label: 'Brazil' },
        ],
      });

      const update = thesaurus.addValues([
        { label: 'Europe', values: [{ label: 'France' }] },
        { label: 'Asia', values: [{ label: 'Japan' }] },
        { label: 'Asia' }, // should be ignored
        { label: 'USA' }, // should be ignored
        { label: 'Brazil', values: [{ label: 'Rio de Janeiro' }] }, // should be ignored
      ]);

      expect(update).toEqual({
        id: expect.any(String),
        name: 'Countries',
        values: [
          {
            id: expect.any(String),
            label: 'Asia',
            values: [
              { id: expect.any(String), label: 'China' },
              { id: expect.any(String), label: 'Japan' },
            ],
          },
          {
            id: expect.any(String),
            label: 'Europe',
            values: [
              { id: expect.any(String), label: 'Italy' },
              { id: expect.any(String), label: 'France' },
            ],
          },
          { id: expect.any(String), label: 'USA' },
          { id: expect.any(String), label: 'Brazil' },
        ],
        hashedValuesById: expect.any(Object),
        hashedValuesByLabel: expect.any(Object),
        before: expect.any(Object),
      });
    });
  });

  describe('update', () => {
    it('should update the name of the thesaurus', () => {
      const thesaurus = Thesaurus.create({
        name: 'Countries',
        values: [{ label: 'USA' }],
      });

      const updated = thesaurus.update({ name: 'Updated Countries' });

      expect(updated.name).toBe('Updated Countries');
      expect(updated.values).toEqual(thesaurus.values);
    });

    it('should update the values of the thesaurus', () => {
      const thesaurus = Thesaurus.create({
        name: 'Countries',
        values: [{ label: 'USA' }, { label: 'Asia', values: [{ label: 'China' }] }],
      });

      const updated1 = thesaurus.update({
        values: [{ label: 'Canada' }, { label: 'Mexico' }],
      });

      const updated2 = thesaurus.update({
        values: [
          ...thesaurus.values,
          { label: 'Canada' },
          { label: 'Mexico' },
          { label: 'Europe', values: [{ label: 'France' }] },
        ],
      });

      const updated3 = thesaurus.update({
        values: [
          { ...thesaurus.values[1], values: [...thesaurus.values[1].values!, { label: 'France' }] },
        ],
      });

      expect(updated1).toEqual({
        id: thesaurus.id,
        name: thesaurus.name,
        values: [
          { id: expect.any(String), label: 'Canada' },
          { id: expect.any(String), label: 'Mexico' },
        ],
        hashedValuesById: expect.any(Object),
        hashedValuesByLabel: expect.any(Object),
        before: expect.any(Object),
      });

      expect(updated2).toEqual({
        id: thesaurus.id,
        name: thesaurus.name,
        values: [
          { id: thesaurus.values[0].id, label: 'USA' },
          {
            id: thesaurus.values[1].id,
            label: 'Asia',
            values: [{ id: thesaurus.values[1].values![0].id, label: 'China' }],
          },
          { id: expect.any(String), label: 'Canada' },
          { id: expect.any(String), label: 'Mexico' },
          {
            id: expect.any(String),
            label: 'Europe',
            values: [{ id: expect.any(String), label: 'France' }],
          },
        ],
        hashedValuesById: expect.any(Object),
        hashedValuesByLabel: expect.any(Object),
        before: expect.any(Object),
      });

      expect(updated3).toEqual({
        id: thesaurus.id,
        name: thesaurus.name,
        values: [
          {
            id: thesaurus.values[1].id,
            label: thesaurus.values[1].label,
            values: [
              { id: thesaurus.values[1].values![0].id, label: 'China' },
              { id: expect.any(String), label: 'France' },
            ],
          },
        ],
        hashedValuesById: expect.any(Object),
        hashedValuesByLabel: expect.any(Object),
        before: expect.any(Object),
      });
    });
  });
});
