"use strict";var _react = _interopRequireDefault(require("react"));

var _enzyme = require("enzyme");

var _SearchList = require("../SearchList");function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('SearchList', () => {
  let searches;
  beforeEach(() => {
    searches = [{
      _id: 'id1',
      searchTerm: 'query',
      documents: [],
      status: 'completed' },
    {
      _id: 'id2',
      searchTerm: 'query',
      documents: [],
      status: 'completed' }];

  });

  const getProps = () => ({ searches });

  const render = () => (0, _enzyme.shallow)(_react.default.createElement(_SearchList.SearchList, getProps()));

  it('should render list of SearchItem with specified searches', () => {
    const component = render();
    expect(component).toMatchSnapshot();
  });
});