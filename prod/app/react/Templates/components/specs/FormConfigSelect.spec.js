"use strict";var _reactReduxForm = require("react-redux-form");
var _immutable = _interopRequireDefault(require("immutable"));
var _react = _interopRequireDefault(require("react"));

var _FormConfigSelect = require("../FormConfigSelect");
var _ReactReduxForms = require("../../../ReactReduxForms");
var _enzyme = require("enzyme");
var _Layout = require("../../../Layout");function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}function ownKeys(object, enumerableOnly) {var keys = Object.keys(object);if (Object.getOwnPropertySymbols) {keys.push.apply(keys, Object.getOwnPropertySymbols(object));}if (enumerableOnly) keys = keys.filter(function (sym) {return Object.getOwnPropertyDescriptor(object, sym).enumerable;});return keys;}function _objectSpread(target) {for (var i = 1; i < arguments.length; i++) {if (i % 2) {var source = arguments[i] != null ? arguments[i] : {};ownKeys(source, true).forEach(function (key) {_defineProperty(target, key, source[key]);});} else if (Object.getOwnPropertyDescriptors) {Object.defineProperties(target, Object.getOwnPropertyDescriptors(arguments[i]));} else {ownKeys(source).forEach(function (key) {Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(arguments[i], key));});}}return target;}function _defineProperty(obj, key, value) {if (key in obj) {Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true });} else {obj[key] = value;}return obj;}

describe('FormConfigSelect', () => {
  let component;
  let thesauris;
  let relationTypes;
  let props;

  beforeEach(() => {
    thesauris = [{ _id: 1, name: 'thesauri1' }, { _id: 2, name: 'thesauri2' }, { _id: 3, name: 'Judge', type: 'template' }];
    relationTypes = [{ _id: 1, name: 'relationType1' }, { _id: 2, name: 'relationType2' }];
    props = {
      type: 'select',
      thesauris: _immutable.default.fromJS(thesauris),
      relationTypes: _immutable.default.fromJS(relationTypes),
      index: 0,
      data: { properties: [{}] },
      formState: {
        $form: {
          errors: {
            'properties.0.label.required': false,
            'properties.0.label.duplicated': false,
            'properties.0.content.required': false } } } };




  });

  it('should render fields with the correct datas', () => {
    component = (0, _enzyme.shallow)(_react.default.createElement(_FormConfigSelect.FormConfigSelect, props));
    const formFields = component.find(_reactReduxForm.Field);
    expect(formFields.getElements()[0].props.model).toBe('template.data.properties[0].label');
    expect(component.find(_ReactReduxForms.Select).props().model).toBe('template.data.properties[0].content');
  });

  it('should render the select with the dictionaries', () => {
    component = (0, _enzyme.shallow)(_react.default.createElement(_FormConfigSelect.FormConfigSelect, props));
    const expectedOptions = [thesauris[0], thesauris[1]];
    expect(component.find(_ReactReduxForms.Select).props().options).toEqual(expectedOptions);
  });

  describe('validation', () => {
    it('should render the label without errors', () => {
      component = (0, _enzyme.shallow)(_react.default.createElement(_FormConfigSelect.FormConfigSelect, props));
      expect(component.find('.has-error').length).toBe(0);
    });
  });

  describe('when changing content', () => {
    it('should show a warning', () => {
      props.data = {
        properties: [{ content: '1' }] };

      component = (0, _enzyme.shallow)(_react.default.createElement(_FormConfigSelect.FormConfigSelect, props));
      expect(component.find(_Layout.Warning).length).toBe(0);

      const newProps = _objectSpread({}, props, { data: { properties: [{ content: '2' }] } });
      component.setProps(newProps);
      component.update();

      expect(component.find(_Layout.Warning).length).toBe(1);

      component.setProps(props);
      component.update();

      expect(component.find(_Layout.Warning).length).toBe(0);
    });
  });

  describe('when the fields are invalid and dirty or the form is submited', () => {
    it('should render the label with errors', () => {
      props.formState.$form.errors['properties.0.label.required'] = true;
      component = (0, _enzyme.shallow)(_react.default.createElement(_FormConfigSelect.FormConfigSelect, props));
      expect(component.find('.has-error').length).toBe(1);
    });

    it('should render the label with errors', () => {
      props.formState.$form.errors['properties.0.label.required'] = true;
      component = (0, _enzyme.shallow)(_react.default.createElement(_FormConfigSelect.FormConfigSelect, props));
      expect(component.find('.has-error').length).toBe(1);
    });

    it('should render the list select with errors', () => {
      props.formState.$form.errors['properties.0.content.required'] = true;
      props.formState.$form.submitFailed = true;
      component = (0, _enzyme.shallow)(_react.default.createElement(_FormConfigSelect.FormConfigSelect, props));
      expect(component.find('.has-error').length).toBe(1);
    });
  });
});