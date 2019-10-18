"use strict";var _react = _interopRequireDefault(require("react"));
var _enzyme = require("enzyme");
var _FormConfigMultimedia = _interopRequireWildcard(require("../FormConfigMultimedia"));function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('FormConfigMultimedia', () => {
  let component;
  let state;
  let props;
  beforeEach(() => {
    props = { index: 0 };
    state = {
      template: {
        data: { properties: [{ label: '' }] },
        formState: {
          'properties.0.label': { valid: true, dirty: false, errors: {} },
          $form: {
            errors: {
              'properties.0.label.required': false,
              'properties.0.label.duplicated': false } } } } };





  });

  const render = () => {
    const mappedProps = Object.assign({}, props, (0, _FormConfigMultimedia.mapStateToProps)(state, props));
    component = (0, _enzyme.shallow)(_react.default.createElement(_FormConfigMultimedia.default.WrappedComponent, mappedProps));
  };

  const expectMatch = () => {
    render();
    expect(component).toMatchSnapshot();
  };

  const expectErrorLengthToBe = length => {
    render();
    expect(component.find('.has-error').length).toBe(length);
  };

  it('should hold show label, show in card and select card style type options by default', () => {
    expectMatch();
  });

  it('should allow setting a help text', () => {
    props.helpText = 'Some help text';
    expectMatch();
  });

  it('should allow excluding "show in card"', () => {
    props.canShowInCard = false;
    expectMatch();
  });

  it('should allow excluding "style"', () => {
    props.canSetStyle = false;
    expectMatch();
  });

  it('should allow excluding "required"', () => {
    props.canBeRequired = false;
    expectMatch();
  });

  describe('validation', () => {
    it('should render the label without errors', () => {
      expectErrorLengthToBe(0);
    });
  });

  describe('when the field is invalid and dirty or the form is submited', () => {
    it('should render the label with errors', () => {
      state.template.formState.$form.errors['properties.0.label.required'] = true;
      state.template.formState['properties.0.label'].dirty = true;
      expectErrorLengthToBe(1);
    });

    it('should render the label with errors', () => {
      state.template.formState.$form.errors['properties.0.label.required'] = true;
      state.template.formState.submitFailed = true;
      expectErrorLengthToBe(1);
    });
  });
});