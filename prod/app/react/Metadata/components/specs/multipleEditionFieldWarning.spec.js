"use strict";var _react = _interopRequireDefault(require("react"));
var _enzyme = require("enzyme");
var _UI = require("../../../UI");

var _MultipleEditionFieldWarning = require("../MultipleEditionFieldWarning");function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('FormGroup', () => {
  let component;
  let props;

  beforeEach(() => {
    props = {};
  });

  const render = () => {
    component = (0, _enzyme.shallow)(_react.default.createElement(_MultipleEditionFieldWarning.MultipleEditionFieldWarning, props));
  };

  describe('when multipleEdition and touched', () => {
    it('should render a warning', () => {
      props.multipleEdition = true;
      props.touched = true;
      render();
      expect(component.find(_UI.Icon).props().icon).toBe('exclamation-triangle');
    });
  });

  describe('when multipleEdition and not touched', () => {
    it('should not render a warning', () => {
      props.multipleEdition = true;
      props.touched = false;
      render();
      const warning = component.find('.fa-warning');
      expect(warning.length).toBe(0);
    });
  });

  describe('when not multipleEdition and touched', () => {
    it('should not render a warning', () => {
      props.multipleEdition = false;
      props.touched = true;
      render();
      const warning = component.find('.fa-warning');
      expect(warning.length).toBe(0);
    });
  });

  describe('mapStateToProps', () => {
    it('should map pristine', () => {
      let state = { namespace: { $form: { model: 'namespace' }, field: { pristine: false } } };
      expect((0, _MultipleEditionFieldWarning.mapStateToProps)(state, { model: 'namespace', field: 'field' }).touched).toEqual(true);

      state = { namespace: { $form: { model: 'namespace' }, field: { $form: { pristine: false } } } };
      expect((0, _MultipleEditionFieldWarning.mapStateToProps)(state, { model: 'namespace', field: 'field' }).touched).toEqual(true);

      state = { namespace: { $form: { model: 'namespace' }, field: { pristine: true } } };
      expect((0, _MultipleEditionFieldWarning.mapStateToProps)(state, { model: 'namespace', field: 'field' }).touched).toEqual(false);

      state = { namespace: { $form: { model: 'namespace' }, field: { $form: { pristine: true } } } };
      expect((0, _MultipleEditionFieldWarning.mapStateToProps)(state, { model: 'namespace', field: 'field' }).touched).toEqual(false);
    });
  });
});