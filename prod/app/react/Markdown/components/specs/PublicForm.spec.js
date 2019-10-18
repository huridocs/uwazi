"use strict";var _react = _interopRequireDefault(require("react"));
var _enzyme = require("enzyme");
var _immutable = _interopRequireDefault(require("immutable"));
var _reactReduxForm = require("react-redux-form");
var _PublicForm = _interopRequireDefault(require("../PublicForm.js"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}function ownKeys(object, enumerableOnly) {var keys = Object.keys(object);if (Object.getOwnPropertySymbols) {keys.push.apply(keys, Object.getOwnPropertySymbols(object));}if (enumerableOnly) keys = keys.filter(function (sym) {return Object.getOwnPropertyDescriptor(object, sym).enumerable;});return keys;}function _objectSpread(target) {for (var i = 1; i < arguments.length; i++) {if (i % 2) {var source = arguments[i] != null ? arguments[i] : {};ownKeys(source, true).forEach(function (key) {_defineProperty(target, key, source[key]);});} else if (Object.getOwnPropertyDescriptors) {Object.defineProperties(target, Object.getOwnPropertyDescriptors(arguments[i]));} else {ownKeys(source).forEach(function (key) {Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(arguments[i], key));});}}return target;}function _defineProperty(obj, key, value) {if (key in obj) {Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true });} else {obj[key] = value;}return obj;}

describe('PublicForm', () => {
  let props;
  let component;
  let instance;
  let submit;
  let request;

  beforeEach(() => {
    request = Promise.resolve({ promise: Promise.resolve('ok') });
    submit = jasmine.createSpy('submit').and.returnValue(request);
  });

  const render = customProps => {
    props = {
      template: _immutable.default.fromJS({ _id: '123', properties: [{ type: 'text', name: 'text' }] }),
      thesauris: _immutable.default.fromJS([]),
      file: false,
      attachments: false,
      submit,
      remote: false };

    const mappedProps = _objectSpread({}, props, {}, customProps);
    component = (0, _enzyme.shallow)(_react.default.createElement(_PublicForm.default.WrappedComponent, mappedProps));
    instance = component.instance();
    instance.refreshCaptcha = jasmine.createSpy('refreshCaptcha');
    instance.formDispatch = jasmine.createSpy('formDispatch');
  };

  it('should render a form', () => {
    render();
    expect(component).toMatchSnapshot();
  });

  it('should enable remote captcha', () => {
    render({ remote: true });
    expect(component).toMatchSnapshot();
  });

  it('should render a form with file and attachments', () => {
    render({ file: true, attachments: true });
    expect(component).toMatchSnapshot();
  });

  it('should submit the values', () => {
    render();
    component.find(_reactReduxForm.LocalForm).simulate('submit', { title: 'test' });
    expect(props.submit).toHaveBeenCalledWith({ file: undefined, title: 'test', template: '123' }, false);
  });

  it('should refresh the captcha and clear the form after submit', done => {
    render();
    component.find(_reactReduxForm.LocalForm).simulate('submit', { title: 'test' });
    request.then(uploadCompletePromise => {
      uploadCompletePromise.promise.then(() => {
        expect(instance.formDispatch).toHaveBeenCalledWith({ model: 'publicform', type: 'rrf/reset' });
        expect(instance.refreshCaptcha).toHaveBeenCalled();
        done();
      });
    });
  });

  it('should refresh captcha and NOT clear the form on submission error', done => {
    request = new Promise(resolve => {
      resolve({ promise: Promise.reject() });
    });
    submit = jasmine.createSpy('submit').and.returnValue(request);
    render();
    component.find(_reactReduxForm.LocalForm).simulate('submit', { title: 'test' });
    request.then(uploadCompletePromise => {
      uploadCompletePromise.promise.
      then(() => fail('should throw error')).
      catch(() => {
        expect(instance.formDispatch).not.toHaveBeenCalledWith();
        expect(instance.refreshCaptcha).toHaveBeenCalled();
        done();
      });
    });
  });
});