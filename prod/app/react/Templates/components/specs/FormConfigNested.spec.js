"use strict";var _react = _interopRequireDefault(require("react"));
var _enzyme = require("enzyme");

var _FormConfigNested = require("../FormConfigNested");
var _reactReduxForm = require("react-redux-form");function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('FormConfigNested', () => {
  let component;
  let props;

  beforeEach(() => {
    props = {
      index: 0,
      type: 'nested',
      data: { properties: [{ nestedProperties: [
          { key: 'nestedPropOne', label: 'nested prop one' },
          { key: 'nestedPropTwo', label: 'nested prop two' }] }] },

      setNestedProperties: jasmine.createSpy('setNestedProperties'),
      formState: {
        'properties.0.label': { valid: true, dirty: false, errors: {} },
        $form: {
          errors: {
            'properties.0.label.required': false,
            'properties.0.label.duplicated': false } } } };




  });

  it('should render fields with the correct datas', () => {
    component = (0, _enzyme.shallow)(_react.default.createElement(_FormConfigNested.FormConfigNested, props));
    const formFields = component.find(_reactReduxForm.Field);
    expect(formFields.getElements()[0].props.model).toBe('template.data.properties[0].label');
  });

  describe('validation', () => {
    it('should render the label without errors', () => {
      component = (0, _enzyme.shallow)(_react.default.createElement(_FormConfigNested.FormConfigNested, props));
      expect(component.find('.has-error').length).toBe(0);
    });
  });

  describe('when the fields are invalid and dirty or the form is submited', () => {
    it('should render the label with errors', () => {
      props.formState.$form.errors['properties.0.label.required'] = true;
      props.formState['properties.0.label'].dirty = true;
      component = (0, _enzyme.shallow)(_react.default.createElement(_FormConfigNested.FormConfigNested, props));
      expect(component.find('.has-error').length).toBe(1);
    });

    it('should render the label with errors', () => {
      props.formState.$form.errors['properties.0.label.required'] = true;
      props.formState.submitFailed = true;
      component = (0, _enzyme.shallow)(_react.default.createElement(_FormConfigNested.FormConfigNested, props));
      expect(component.find('.has-error').length).toBe(1);
    });
  });
});