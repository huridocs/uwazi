"use strict";var _react = _interopRequireDefault(require("react"));
var _enzyme = require("enzyme");
var _reactFlags = _interopRequireDefault(require("react-flags"));
var _worldCountries = _interopRequireDefault(require("world-countries"));

var _UI = require("../../../UI");
var _library = require("../../../UI/Icon/library");

var _IconSelector = _interopRequireWildcard(require("../IconSelector"));
var _DropdownList = _interopRequireDefault(require("../DropdownList"));function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}


describe('ListItem', () => {
  let component;
  let instance;
  let props;

  const render = () => {
    component = (0, _enzyme.shallow)(_react.default.createElement(_IconSelector.ListItem, props));
    instance = component.instance();
  };

  it('should render a fontawesome icon and label', () => {
    props = { item: { _id: 'faicon', type: 'Icons', label: 'Faicon Label' } };
    render();

    expect(component.find(_UI.Icon).props().icon).toBe('faicon');
    expect(component.text()).toContain('Faicon Label');
  });

  it('should render a flag and label', () => {
    props = { item: { _id: 'COUNTRY_CODE', type: 'Flags', label: 'Flag Label' } };
    render();

    expect(component.find(_reactFlags.default).props().name).toBe('COUNTRY_CODE');
    expect(component.text()).toContain('Flag Label');
  });

  it('should update only if item _id changes', () => {
    props = { item: { _id: 'faicon', type: 'Icons', label: 'Faicon Label' } };
    render();
    expect(instance.shouldComponentUpdate({ item: { _id: 'anothericon' } })).toBe(true);
    expect(instance.shouldComponentUpdate({ item: { _id: 'faicon' } })).toBe(false);
  });
});

describe('IconSelector', () => {
  let component;
  let props;

  const render = () => {
    props = { onChange: 'Function' };
    component = (0, _enzyme.shallow)(_react.default.createElement(_IconSelector.default, props));
  };

  it('should have an empty option', () => {
    render();
    expect(component.find(_DropdownList.default).props().data[0]._id).toBe(null);
    expect(component.find(_DropdownList.default).props().data[0].type).toBe('Empty');
  });

  it('should render a DropdownList with icons and flags, extending passed props', () => {
    render();
    const firstFlagIndex = component.find(_DropdownList.default).props().data.length - _worldCountries.default.length;
    expect(component.find(_DropdownList.default).props().data.length).toBe(_library.iconNames.length + _worldCountries.default.length + 1);

    expect(component.find(_DropdownList.default).props().data[1].type).toBe('Icons');
    expect(component.find(_DropdownList.default).props().data[1]._id).toBe(_library.iconNames[0]);
    expect(component.find(_DropdownList.default).props().data[1].label).toBe(_library.iconNames[0]);

    expect(component.find(_DropdownList.default).props().data[firstFlagIndex].type).toBe('Flags');
    expect(component.find(_DropdownList.default).props().data[firstFlagIndex]._id).toBe(_worldCountries.default[0].cca3);
    expect(component.find(_DropdownList.default).props().data[firstFlagIndex].label).toBe(_worldCountries.default[0].name.common);

    expect(component.find(_DropdownList.default).props().valueComponent).toBe(_IconSelector.ListItem);
    expect(component.find(_DropdownList.default).props().itemComponent).toBe(_IconSelector.ListItem);
    expect(component.find(_DropdownList.default).props().defaultValue).toBe(component.find(_DropdownList.default).props().data[0]);
    expect(component.find(_DropdownList.default).props().onChange).toBe('Function');
  });
});