"use strict";var _react = _interopRequireDefault(require("react"));
var _enzyme = require("enzyme");
var _immutable = require("immutable");

var _Lists = require("../../../Layout/Lists");
var _I18N = require("../../../I18N");
var _ItemList = require("../ItemList");
var _slider = _interopRequireDefault(require("../slider"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('ItemList', () => {
  let component;
  let props;

  beforeEach(() => {
    props = {
      items: [{ i: 'item1' }, { i: 'item2' }, { i: 'item3' }],
      options: {},
      link: '/?a=b' };

  });

  const render = () => {
    component = (0, _enzyme.shallow)(_react.default.createElement(_ItemList.ItemList, props));
  };

  describe('when options slider = true', () => {
    it('should include all the items inside a RowList > Slider element', () => {
      props.options = { slider: true };
      render();
      const docs = component.find(_Lists.RowList).children(_slider.default).at(0).children();
      expect(component.find(_Lists.RowList).children(_slider.default).at(0).children().length).toBe(3);
      expect(docs.at(0).props().doc).toEqual((0, _immutable.fromJS)(props.items[0]));
      expect(docs.at(1).props().doc).toEqual((0, _immutable.fromJS)(props.items[1]));
      expect(docs.at(2).props().doc).toEqual((0, _immutable.fromJS)(props.items[2]));
    });
  });

  it('should include all the items inside a RowList element', () => {
    render();
    expect(component.find(_Lists.RowList).children().length).toBe(3);
    const docs = component.find(_Lists.RowList).children();
    expect(docs.at(0).props().doc).toEqual((0, _immutable.fromJS)(props.items[0]));
    expect(docs.at(1).props().doc).toEqual((0, _immutable.fromJS)(props.items[1]));
    expect(docs.at(2).props().doc).toEqual((0, _immutable.fromJS)(props.items[2]));
  });

  it('should pass the list search params as searchParams to the Doc', () => {
    props.link = '/es/?sort=sortProperty';
    render();
    expect(component.find(_Lists.RowList).children().at(0).props().searchParams).toEqual({ sort: 'sortProperty' });
  });

  it('should default to sort: titel if no searchParams on link', () => {
    render();
    expect(component.find(_Lists.RowList).children().at(0).props().searchParams).toEqual({ sort: 'title' });
  });

  it('should have a button to the Link provided', () => {
    render();
    expect(component.find(_I18N.I18NLink).props().to).toBe(props.link);
  });
});