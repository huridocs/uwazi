"use strict";var _react = _interopRequireDefault(require("react"));
var _reactReduxForm = require("react-redux-form");
var _enzyme = require("enzyme");

var _FormConfigInput = require("../FormConfigInput");
var _PropertyConfigOptions = _interopRequireDefault(require("../PropertyConfigOptions"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('FormConfigInput', () => {
  let component;
  let props;

  beforeEach(() => {
    props = {
      type: 'text',
      index: 0,
      property: { label: '' },
      formState: {
        'properties.0.label': { valid: true, dirty: false, errors: {} },
        $form: {
          errors: {
            'properties.0.label.required': false,
            'properties.0.label.duplicated': false } } } };




  });

  it('should render Fields with the correct datas', () => {
    component = (0, _enzyme.shallow)(_react.default.createElement(_FormConfigInput.FormConfigInput, props));
    const formFields = component.find(_reactReduxForm.Field);
    expect(formFields.getElements()[0].props.model).toBe('template.data.properties[0].label');
    expect(component.find(_PropertyConfigOptions.default).props().canBeFilter).toBe(true);
  });

  describe('validation', () => {
    it('should render the label without errors', () => {
      component = (0, _enzyme.shallow)(_react.default.createElement(_FormConfigInput.FormConfigInput, props));
      expect(component.find('.has-error').length).toBe(0);
    });
  });

  describe('options', () => {
    it('should pass on the canBeFilter option', () => {
      props.canBeFilter = false;
      component = (0, _enzyme.shallow)(_react.default.createElement(_FormConfigInput.FormConfigInput, props));
      expect(component.find(_PropertyConfigOptions.default).props().canBeFilter).toBe(false);
    });
  });

  describe('when the field is invalid and dirty or the form is submited', () => {
    it('should render the label with errors', () => {
      props.formState.$form.errors['properties.0.label.required'] = true;
      props.formState['properties.0.label'].dirty = true;
      component = (0, _enzyme.shallow)(_react.default.createElement(_FormConfigInput.FormConfigInput, props));
      expect(component.find('.has-error').length).toBe(1);
    });

    it('should render the label with errors', () => {
      props.formState.$form.errors['properties.0.label.required'] = true;
      props.formState.submitFailed = true;
      component = (0, _enzyme.shallow)(_react.default.createElement(_FormConfigInput.FormConfigInput, props));
      expect(component.find('.has-error').length).toBe(1);
    });
  });
});