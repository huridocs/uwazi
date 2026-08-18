import type { ClientProperty } from '#V2/shared/types.js';
import { sortByTemplatePropertyOrder } from '../sortByTemplatePropertyOrder';

const properties: ClientProperty[] = [
  { _id: 'a', name: 'a', type: 'text', label: 'A' },
  { _id: 'b', name: 'b', type: 'text', label: 'B' },
  { _id: 'c', name: 'c', type: 'image', label: 'C' },
];

describe('sortByTemplatePropertyOrder', () => {
  it('sorts by template.properties order and keeps unknown ids in original relative order', () => {
    const items = [
      { _id: 'c' },
      { _id: 'unknown-2' },
      { _id: 'a' },
      { _id: 'unknown-1' },
      { _id: 'b' },
    ];
    expect(sortByTemplatePropertyOrder(items, properties).map(item => item._id)).toEqual([
      'a',
      'b',
      'c',
      'unknown-2',
      'unknown-1',
    ]);
  });

  it('uses the earliest propertyGroup member when the field id is synthetic', () => {
    const grouped = { _id: 'group1', propertyGroup: [{ _id: 'c' }, { _id: 'a' }] };
    expect(
      sortByTemplatePropertyOrder([{ _id: 'b' }, grouped], properties).map(item => item._id)
    ).toEqual(['group1', 'b']);
  });

  it('returns a shallow copy when the template has no properties', () => {
    const items = [{ _id: 'z' }, { _id: 'y' }];
    expect(sortByTemplatePropertyOrder(items, undefined)).toEqual(items);
    expect(sortByTemplatePropertyOrder(items, [])).toEqual(items);
    expect(sortByTemplatePropertyOrder(items, [])).not.toBe(items);
  });
});
