"use strict";var _react = _interopRequireDefault(require("react"));
var _enzyme = require("enzyme");
var _immutable = require("immutable");
var _Loader = _interopRequireDefault(require("../../../components/Elements/Loader"));

var _SearchResults = require("../SearchResults");function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('SearchResults', () => {
  let component;
  let props;

  beforeEach(() => {
    props = {
      results: (0, _immutable.fromJS)([{ sharedId: 'r1' }, { sharedId: 'r2' }]),
      onClick: jasmine.createSpy('onClick'),
      selected: 'r2',
      searching: false };

  });

  function render() {
    component = (0, _enzyme.shallow)(_react.default.createElement(_SearchResults.SearchResults, props));
  }

  it('should render the results with onClick for each item', () => {
    render();
    expect(component.find('.item').length).toBe(2);
    expect(component.find(_Loader.default).length).toBe(0);

    component.find('.item').at(0).simulate('click');
    expect(props.onClick).toHaveBeenCalledWith('r1', { sharedId: 'r1' });

    component.find('.item').at(1).simulate('click');
    expect(props.onClick).toHaveBeenCalledWith('r2', { sharedId: 'r2' });
  });

  it('should mark the selected item', () => {
    render();
    expect(component.find('.item').at(0).props().className).not.toContain('is-selected');
    expect(component.find('.item').at(1).props().className).toContain('is-selected');
  });

  it('should add the loader when searching for results', () => {
    props.searching = true;
    render();
    expect(component.find(_Loader.default).length).toBe(1);
  });
});