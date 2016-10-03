import DropdownList from '../DropdownList';

describe('DropdownList', () => {
  it('should update the component if value changes', () => {
    const instance = new DropdownList();
    expect(instance.shouldComponentUpdate.call({props: {value: 'a'}}, {value: 'b'})).toBe(true);
  });

  it('should not update the component if value remains', () => {
    const instance = new DropdownList();
    expect(instance.shouldComponentUpdate.call({props: {value: 'a'}}, {value: 'a'})).toBe(false);
  });
});
