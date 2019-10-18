"use strict";var _react = _interopRequireDefault(require("react"));
var _enzyme = require("enzyme");
var _immutable = require("immutable");
var _reduxMockStore = _interopRequireDefault(require("redux-mock-store"));
var _TemplateLabel = _interopRequireDefault(require("../TemplateLabel"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}function _extends() {_extends = Object.assign || function (target) {for (var i = 1; i < arguments.length; i++) {var source = arguments[i];for (var key in source) {if (Object.prototype.hasOwnProperty.call(source, key)) {target[key] = source[key];}}}return target;};return _extends.apply(this, arguments);}

describe('TemplateLabel', () => {
  let component;

  let initialState;
  const props = { template: 'templateId' };

  beforeEach(() => {
    initialState = {
      templates: (0, _immutable.fromJS)([
      { _id: 'templateId', name: 'title' },
      { _id: 'templateId2', name: 'title 2', isEntity: true }]) };


  });

  const render = () => {
    const mockStore = (0, _reduxMockStore.default)();
    const store = mockStore(initialState);
    component = (0, _enzyme.shallow)(_react.default.createElement(_TemplateLabel.default, _extends({ store: store }, props)));
  };

  it('should render the name of the template', () => {
    render();
    expect(component.prop('name')).toBe('title');
    expect(component.prop('template')).toBe('templateId');

    props.template = 'templateId2';
    render();
    expect(component.prop('name')).toBe('title 2');
    expect(component.prop('template')).toBe('templateId2');
  });

  it('should add consecutive type classNames for each template', () => {
    props.template = 'templateId';
    render();
    expect(component.prop('className')).toBe('btn-color btn-color-0');

    props.template = 'templateId2';
    render();
    expect(component.prop('className')).toBe('btn-color btn-color-1');
  });

  it('should cycle back through colors if there more than 19 templates', () => {
    const templates = [];
    for (let i = 0; i < 20; i += 1) {
      templates.push({ _id: `templateId${i}`, name: `title ${i}` });
    }
    initialState.templates = (0, _immutable.fromJS)(templates);
    props.template = 'templateId19';
    render();
    expect(component.prop('className')).toBe('btn-color btn-color-0');
  });

  it('should display the template color if template has a custom color', () => {
    initialState.templates = (0, _immutable.fromJS)([{ _id: 'templateId', name: 'title', color: '#112233' }]);
    props.template = 'templateId';
    render();
    expect(component.prop('className')).toBe('btn-color');
    expect(component.prop('style')).toEqual({ backgroundColor: '#112233' });
  });
});