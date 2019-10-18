"use strict";var _DropdownList = _interopRequireDefault(require("../DropdownList"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('DropdownList', () => {
  it('should update the component if value changes', () => {
    const instance = new _DropdownList.default();
    expect(instance.shouldComponentUpdate.call({ props: { value: 'a' } }, { value: 'b' })).toBe(true);
  });

  it('should not update the component if value remains', () => {
    const instance = new _DropdownList.default();
    expect(instance.shouldComponentUpdate.call({ props: { value: 'a' } }, { value: 'a' })).toBe(false);
  });
});