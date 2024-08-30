import {
  filterAvailableTemplates,
  deleteFilters,
  updateFilters,
  sanitizeFilters,
} from '../helpers';
import { filters, templates } from './fixtures';

describe('Filters helpers', () => {
  describe('filterAvailableTemplates', () => {
    it('should not return templates that are already used by filters', () => {
      let result = filterAvailableTemplates(templates);
      expect(result).toEqual(templates);

      result = filterAvailableTemplates(templates, [
        { id: 'id2', name: 'Template 2', rowId: 'id2' },
      ]);
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
          rowId: 'someRandomId',
          name: 'A group',
          subRows: [
            { rowId: 'id1', id: 'id1', name: 'Template 1' },
            { rowId: 'id4', id: 'id4', name: 'Template 4' },
          ],
        },
        {
          id: 'id2',
          rowId: 'id2',
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
    it('should remove from the filters list based selected rows', () => {
      let result = deleteFilters(filters);
      expect(result).toEqual(filters);

      result = deleteFilters(filters, ['2', 'template_id3']);

      expect(result).toEqual([
        {
          id: 'randomGroupId',
          _id: '1',
          rowId: '1',
          name: 'Group 1',
          subRows: [
            {
              id: 'template_id2',
              rowId: 'template_id2',
              name: 'Template 2',
            },
          ],
        },
        {
          id: 'randomGroupId2',
          _id: '4',
          rowId: '4',
          name: 'Group 2',
          subRows: [
            {
              rowId: 'template_id5',
              id: 'template_id5',
              name: 'Template 5',
            },
          ],
        },
        {
          id: 'template_id4',
          _id: '3',
          rowId: '3',
          name: 'Template 4',
        },
      ]);
    });
  });

  describe('sanitizeFilters', () => {
    it('should remove _id from root items moved into groups, rowIds and transform subrows into items', () => {
      const result = sanitizeFilters([
        {
          id: 'randomGroupId',
          _id: '1',
          rowId: '1',
          name: 'Group 1',
          subRows: [
            {
              id: 'template_id2',
              name: 'Template 2',
              //this _id comes when users drag and drop a root filter inside a group
              //@ts-ignore
              _id: 'rootItemId',
              rowId: 'rootItemId',
            },
            {
              id: 'template_id3',
              name: 'Template 3',
              rowId: 'template_id3',
            },
          ],
        },
        {
          id: 'template_id1',
          _id: '2',
          rowId: '2',
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
          _id: '2',
          name: 'Template 1',
        },
      ]);
    });

    it('should remove empty groups', () => {
      const result = sanitizeFilters([
        {
          id: 'randomGroupId',
          _id: '1',
          rowId: '1',
          name: 'Group 1',
          subRows: [],
        },
        {
          id: 'template_id1',
          _id: '2',
          rowId: '2',
          name: 'Template 1',
        },
      ]);

      expect(result).toEqual([
        {
          id: 'template_id1',
          _id: '2',
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
          rowId: '3',
          name: 'Template 4',
        },
        filters
      );
      expect(result).toEqual(filters);

      result = updateFilters({
        id: 'a new filter group id',
        rowId: 'a new filter group id',
        name: 'A new group',
        subRows: [{ rowId: 'new', name: 'new', id: 'new' }],
      });
      expect(result).toEqual([
        {
          id: 'a new filter group id',
          rowId: 'a new filter group id',
          name: 'A new group',
          subRows: [{ name: 'new', id: 'new', rowId: 'new' }],
        },
      ]);

      result = updateFilters(
        {
          id: 'a new filter group id',
          rowId: 'a new filter group id',
          name: 'A new group',
          subRows: [{ name: 'new', id: 'new', rowId: 'new' }],
        },
        filters
      );
      expect(result).toEqual([
        ...filters,
        {
          id: 'a new filter group id',
          rowId: 'a new filter group id',
          name: 'A new group',
          subRows: [{ name: 'new', id: 'new', rowId: 'new' }],
        },
      ]);

      result = updateFilters(
        {
          id: 'randomGroupId2',
          _id: '4',
          name: 'Group 2',
          rowId: '4',
          subRows: [
            {
              id: 'template_id5',
              name: 'Template 5',
              rowId: 'template_id5',
            },
            {
              id: 'template_id6',
              name: 'Template 6',
              rowId: 'template_id6',
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
          rowId: '1',
          subRows: [
            {
              id: 'template_id2',
              name: 'Template 2',
              rowId: 'template_id2',
            },
            {
              id: 'template_id3',
              name: 'Template 3',
              rowId: 'template_id3',
            },
          ],
        },
        {
          id: 'template_id1',
          _id: '2',
          name: 'Template 1',
          rowId: '2',
        },
        {
          id: 'randomGroupId2',
          _id: '4',
          rowId: '4',
          name: 'Group 2',
          subRows: [
            {
              id: 'template_id5',
              name: 'Template 5',
              rowId: 'template_id5',
            },
            {
              id: 'template_id6',
              name: 'Template 6',
              rowId: 'template_id6',
            },
          ],
        },
        {
          id: 'template_id4',
          _id: '3',
          rowId: '3',
          name: 'Template 4',
        },
      ]);

      result = updateFilters(
        {
          id: 'randomGroupId',
          _id: '1',
          rowId: '1',
          name: 'Group 1',
          subRows: [
            {
              id: 'template_id3',
              name: 'Template 3',
              rowId: 'template_id3',
            },
          ],
        },
        filters
      );
      expect(result).toEqual([
        {
          id: 'randomGroupId',
          _id: '1',
          rowId: '1',
          name: 'Group 1',
          subRows: [
            {
              id: 'template_id3',
              name: 'Template 3',
              rowId: 'template_id3',
            },
          ],
        },
        {
          id: 'template_id1',
          _id: '2',
          rowId: '2',
          name: 'Template 1',
        },
        {
          id: 'randomGroupId2',
          _id: '4',
          rowId: '4',
          name: 'Group 2',
          subRows: [
            {
              id: 'template_id5',
              name: 'Template 5',
              rowId: 'template_id5',
            },
          ],
        },
        {
          id: 'template_id4',
          _id: '3',
          rowId: '3',
          name: 'Template 4',
        },
      ]);
    });
  });
});
