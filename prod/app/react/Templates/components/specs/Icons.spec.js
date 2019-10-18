"use strict";var _Icons = _interopRequireDefault(require("../Icons"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('Icons', () => {
  it('should hold the option icons map', () => {
    expect(_Icons.default).toMatchSnapshot();
  });
});