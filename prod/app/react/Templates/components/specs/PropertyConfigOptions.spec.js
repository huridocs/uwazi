"use strict";var _react = _interopRequireDefault(require("react"));
var _enzyme = require("enzyme");

var _PropertyConfigOptions = _interopRequireDefault(require("../PropertyConfigOptions"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('PropertyConfigOptions', () => {
  let component;
  let props;

  beforeEach(() => {
    props = {
      index: 2,
      type: 'select',
      property: {} };

  });

  const expectMatch = () => {
    component = (0, _enzyme.shallow)(_react.default.createElement(_PropertyConfigOptions.default, props));
    expect(component).toMatchSnapshot();
  };

  it('should render fields with the correct datas', () => {
    expectMatch();
  });

  describe('Once the property is checked as filter', () => {
    it('should render the default filter option', () => {
      props.property.filter = true;
      expectMatch();
    });
  });

  describe('priority sorting option', () => {
    describe('when property filter is true', () => {
      it('should render for text, date, numeric and select if property filter is true', () => {
        props.property.filter = true;
        props.type = 'text';
        expectMatch();
        props.type = 'date';
        expectMatch();
        props.type = 'numeric';
        expectMatch();
        props.type = 'select';
        expectMatch();
      });
    });
    describe('when property filter is not true', () => {
      it('should not render priority sorting option', () => {
        props.property.filter = false;
        props.type = 'text';
        expectMatch();
        props.type = 'date';
        expectMatch();
        props.type = 'numeric';
        expectMatch();
        props.type = 'select';
        expectMatch();
      });
    });
  });

  describe('Additional options', () => {
    it('should allow to exclude the "use as filter" option', () => {
      props.canBeFilter = false;
      expectMatch();
    });
  });
});