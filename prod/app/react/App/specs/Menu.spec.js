"use strict";var _react = _interopRequireDefault(require("react"));
var _enzyme = require("enzyme");
var _immutable = _interopRequireDefault(require("immutable"));
var _I18N = require("../../I18N");
var _Menu = require("../Menu");function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('Menu', () => {
  let component;
  let props;

  beforeEach(() => {
    props = {
      user: _immutable.default.fromJS({}),
      links: _immutable.default.fromJS([
      { _id: 1, url: 'internal_url', title: 'Internal url' },
      { _id: 2, url: 'http://external_url', title: 'External url' },
      { _id: 3, url: undefined, title: 'undefined url' },
      { _id: 4, url: '/', title: 'single slash url' }]),

      libraryFilters: _immutable.default.fromJS({
        properties: [] }),

      location: { query: { searchTerm: 'asd' } },
      uploadsFilters: _immutable.default.fromJS({
        properties: [] }) };


  });

  const render = () => {
    component = (0, _enzyme.shallow)(_react.default.createElement(_Menu.Menu, props));
  };

  it('Renders external and internal links', () => {
    render();

    const internalLink = component.find('.menuNav-list').first().find(_I18N.I18NLink);
    expect(internalLink.length).toBe(3);
    expect(internalLink.at(0).props().to).toBe('internal_url');
    expect(internalLink.at(1).props().to).toBe('/');
    expect(internalLink.at(2).props().to).toBe('/');

    const externalLink = component.find('.menuNav-list').first().find('a');
    expect(externalLink.length).toBe(1);
    expect(externalLink.props().href).toBe('http://external_url');
    expect(externalLink.props().target).toBe('_blank');
  });
});