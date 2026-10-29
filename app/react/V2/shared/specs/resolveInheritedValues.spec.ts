import { resolveInheritedValues } from '../resolveInheritedValues.js';

type Chain = {
  label: string;
  inheritedType?: string;
  inheritedValue?: Chain[];
};

describe('resolveInheritedValues', () => {
  it('stops when an inherited value points back at an ancestor', () => {
    const parent: Chain = { label: 'Parent', inheritedType: 'relationship' };
    const child: Chain = {
      label: 'Child',
      inheritedType: 'text',
      inheritedValue: [parent],
    };
    parent.inheritedValue = [child];

    expect(resolveInheritedValues([parent], 'date')).toEqual({
      inheritedType: 'text',
      values: [child],
    });
  });
});
