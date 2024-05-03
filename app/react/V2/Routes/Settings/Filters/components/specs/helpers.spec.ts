import {
  filterAvailableTemplates,
  deleteFilters,
  updateFilters,
  sanitizeFilters,
} from '../helpers';

const templates = [
  {
    _id: 'id1',
    name: 'Template 1',
    properties: [],
  },
  {
    _id: 'id2',
    name: 'Template 2',
    properties: [],
  },
  {
    _id: 'id3',
    name: 'Template 3',
    properties: [],
  },
  {
    _id: 'id4',
    name: 'Template 4',
    properties: [],
  },
];

const filters = [
  {
    id: 'randomGroupId',
    _id: '1',
    name: 'Group 1',
    items: [
      {
        id: 'template_id2',
        name: 'Template 2',
      },
      {
        id: 'template_id3',
        name: 'Template 3',
      },
    ],
  },
  {
    id: 'template_id1',
    _id: '2',
    name: 'Template 1',
  },
  {
    id: 'randomGroupId2',
    _id: '4',
    name: 'Group 2',
    items: [
      {
        id: 'template_id5',
        name: 'Template 5',
      },
    ],
  },
  {
    id: 'template_id4',
    _id: '3',
    name: 'Template 4',
  },
];

describe('Filters helpers', () => {
  describe('filterAvailableTemplates', () => {
    it('should not return templates that are already used by filters', () => {
      let result = filterAvailableTemplates(templates);
      expect(result).toEqual(templates);

      result = filterAvailableTemplates(templates, [{ id: 'id2', name: 'Template 2' }]);
      expect(result).toEqual([
        {
          _id: 'id1',
          name: 'Template 1',
          properties: [],
        },
        {
          _id: 'id3',
          name: 'Template 3',
          properties: [],
        },
        {
          _id: 'id4',
          name: 'Template 4',
          properties: [],
        },
      ]);

      result = filterAvailableTemplates(templates, [
        {
          id: 'someRandomId',
          name: 'A group',
          items: [
            { id: 'id1', name: 'Template 1' },
            { id: 'id4', name: 'Template 4' },
          ],
        },
        {
          id: 'id2',
          name: 'Template 2',
        },
      ]);

      expect(result).toEqual([
        {
          _id: 'id3',
          name: 'Template 3',
          properties: [],
        },
      ]);
    });
  });

  describe('deleteFilters', () => {
    it('should remove from the filters list based on id', () => {
      let result = deleteFilters(filters);
      expect(result).toEqual(filters);

      result = deleteFilters(filters, ['template_id1', 'template_id3']);
      expect(result).toEqual([
        {
          id: 'randomGroupId',
          _id: '1',
          name: 'Group 1',
          items: [
            {
              id: 'template_id2',
              name: 'Template 2',
            },
          ],
        },
        {
          id: 'randomGroupId2',
          _id: '4',
          name: 'Group 2',
          items: [
            {
              id: 'template_id5',
              name: 'Template 5',
            },
          ],
        },
        {
          id: 'template_id4',
          _id: '3',
          name: 'Template 4',
        },
      ]);
    });
  });

  describe('sanitizeFilters', () => {
    it('should remove _id from group items', () => {
      let result = sanitizeFilters(filters);
      expect(result).toEqual(filters);

      result = sanitizeFilters([
        {
          id: 'randomGroupId',
          _id: '1',
          name: 'Group 1',
          items: [
            {
              id: 'template_id2',
              name: 'Template 2',
              //this _id comes when users drang and drop a root filter inside a group
              //@ts-ignore
              _id: 'erroneus id',
            },
            {
              id: 'template_id3',
              name: 'Template 3',
            },
          ],
        },
        {
          id: 'template_id1',
          _id: '1',
          name: 'Template 1',
        },
      ]);

      expect(result).toEqual([
        {
          id: 'randomGroupId',
          _id: '1',
          name: 'Group 1',
          items: [
            {
              id: 'template_id2',
              name: 'Template 2',
            },
            {
              id: 'template_id3',
              name: 'Template 3',
            },
          ],
        },
        {
          id: 'template_id1',
          _id: '1',
          name: 'Template 1',
        },
      ]);
    });
  });

  describe('updateFilters', () => {
    it('should return the filters updated', () => {
      let result = updateFilters(
        {
          id: 'template_id4',
          _id: '3',
          name: 'Template 4',
        },
        filters
      );
      expect(result).toEqual(filters);

      result = updateFilters({
        id: 'a new filter group id',
        name: 'A new group',
        items: [{ name: 'new', id: 'new' }],
      });
      expect(result).toEqual([
        {
          id: 'a new filter group id',
          name: 'A new group',
          items: [{ name: 'new', id: 'new' }],
        },
      ]);

      result = updateFilters(
        {
          id: 'a new filter group id',
          name: 'A new group',
          items: [{ name: 'new', id: 'new' }],
        },
        filters
      );
      expect(result).toEqual([
        ...filters,
        {
          id: 'a new filter group id',
          name: 'A new group',
          items: [{ name: 'new', id: 'new' }],
        },
      ]);

      result = updateFilters(
        {
          id: 'randomGroupId2',
          _id: '4',
          name: 'Group 2',
          items: [
            {
              id: 'template_id5',
              name: 'Template 5',
            },
            {
              id: 'template_id6',
              name: 'Template 6',
            },
          ],
        },
        filters
      );
      expect(result).toEqual([
        {
          id: 'randomGroupId',
          _id: '1',
          name: 'Group 1',
          items: [
            {
              id: 'template_id2',
              name: 'Template 2',
            },
            {
              id: 'template_id3',
              name: 'Template 3',
            },
          ],
        },
        {
          id: 'template_id1',
          _id: '2',
          name: 'Template 1',
        },
        {
          id: 'randomGroupId2',
          _id: '4',
          name: 'Group 2',
          items: [
            {
              id: 'template_id5',
              name: 'Template 5',
            },
            {
              id: 'template_id6',
              name: 'Template 6',
            },
          ],
        },
        {
          id: 'template_id4',
          _id: '3',
          name: 'Template 4',
        },
      ]);

      result = updateFilters(
        {
          id: 'randomGroupId',
          _id: '1',
          name: 'Group 1',
          items: [
            {
              id: 'template_id3',
              name: 'Template 3',
            },
          ],
        },
        filters
      );
      expect(result).toEqual([
        {
          id: 'randomGroupId',
          _id: '1',
          name: 'Group 1',
          items: [
            {
              id: 'template_id3',
              name: 'Template 3',
            },
          ],
        },
        {
          id: 'template_id1',
          _id: '2',
          name: 'Template 1',
        },
        {
          id: 'randomGroupId2',
          _id: '4',
          name: 'Group 2',
          items: [
            {
              id: 'template_id5',
              name: 'Template 5',
            },
          ],
        },
        {
          id: 'template_id4',
          _id: '3',
          name: 'Template 4',
        },
      ]);
    });
  });
});
