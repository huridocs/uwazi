import { SettingsFilterSchema } from '#shared/types/settingsType.js';
import { toPersistableFilters } from '../persistableFilters.js';

describe('toPersistableFilters', () => {
  it('should strip leftover mongoose _id from filters and nested items', () => {
    const filters = [
      {
        _id: 'group1',
        id: 'g1',
        name: 'Group',
        items: [{ _id: 'child1', id: 't1', name: 'Template' }],
      },
    ] as unknown as SettingsFilterSchema[];

    expect(toPersistableFilters(filters)).toEqual([
      { id: 'g1', name: 'Group', items: [{ id: 't1', name: 'Template' }] },
    ]);
  });
});
