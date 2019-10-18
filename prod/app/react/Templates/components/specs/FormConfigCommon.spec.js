"use strict";var _react = _interopRequireDefault(require("react"));
var _enzyme = require("enzyme");

var _FormConfigCommon = require("../FormConfigCommon");
var _reactReduxForm = require("react-redux-form");function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('FormConfigCommon', () => {
  let component;
  let props;

  beforeEach(() => {
    props = {
      type: 'text',
      index: -1,
      data: { commonProperties: [{ label: '', name: 'title' }, { label: '', name: 'creationDate' }] },
      formState: {
        'commonProperties.0.label': { valid: true, dirty: false, errors: {} },
        $form: {
          errors: {
            'commonProperties.0.label.required': false,
            'commonProperties.0.label.duplicated': false } } } };




  });

  const render = () => {
    component = (0, _enzyme.shallow)(_react.default.createElement(_FormConfigCommon.FormConfigCommon, props));
    return component;
  };

  it('should render Fields with the correct datas and corrected index', () => {
    component = (0, _enzyme.shallow)(_react.default.createElement(_FormConfigCommon.FormConfigCommon, props));
    const formFields = component.find(_reactReduxForm.Field);
    expect(formFields.getElements()[0].props.model).toBe('template.data.commonProperties[1].prioritySorting');
  });
  it('should render name field if property name is title', () => {
    props.index = -2;
    component = (0, _enzyme.shallow)(_react.default.createElement(_FormConfigCommon.FormConfigCommon, props));
    const formFields = component.find(_reactReduxForm.Field);
    expect(formFields.getElements()[0].props.model).toBe('template.data.commonProperties[0].label');
    expect(formFields.getElements()[1].props.model).toBe('template.data.commonProperties[0].prioritySorting');
  });

  describe('validation', () => {
    beforeEach(() => {
      props.index = -2;
    });
    it('should render the label without errors', () => {
      component = (0, _enzyme.shallow)(_react.default.createElement(_FormConfigCommon.FormConfigCommon, props));
      expect(component.find('.has-error').length).toBe(0);
    });
    it('should render the label with required error', () => {
      props.formState.$form.errors['commonProperties.0.label.required'] = true;
      render();
      expect(component.find('.has-error').length).toBe(1);
    });
    it('should render the label with duplicated error', () => {
      props.formState.$form.errors['commonProperties.0.label.duplicated'] = true;
      render();
      expect(component.find('.has-error').length).toBe(1);
    });
  });
});