"use strict";var _react = _interopRequireDefault(require("react"));
var _enzyme = require("enzyme");
var _immutable = _interopRequireDefault(require("immutable"));
var _TemplateCreator = require("../TemplateCreator");
var _MetadataTemplate = _interopRequireDefault(require("../MetadataTemplate"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('TemplateCreator', () => {
  const template = { id: '1', properties: [{ label: 'label1' }, { label: 'label2' }] };
  const saveTemplate = jasmine.createSpy('saveTemplate');
  const saveEntity = jasmine.createSpy('saveEntity');
  const saveRelationType = jasmine.createSpy('saveRelationType');
  const resetTemplate = jasmine.createSpy('resetTemplate');
  const settings = { collection: _immutable.default.fromJS({}) };

  let component;
  let props;
  let context;

  beforeEach(() => {
    props = { resetTemplate, saveTemplate, saveEntity, saveRelationType, template, settings };
    context = { router: { isActive: jasmine.createSpy('isActive') } };
  });

  const render = () => {
    component = (0, _enzyme.shallow)(_react.default.createElement(_TemplateCreator.TemplateCreator, props), { context });
  };

  const expectSave = expectedSave => {
    render();
    expect(component.find(_MetadataTemplate.default).props().saveTemplate).toBe(expectedSave);
  };

  it('should pass the saveTemplate action to the MetadataTemplate component', () => {
    expectSave(saveTemplate);
  });

  describe('Property Options', () => {
    it('should include most common options by default (entity)', () => {
      props.entity = true;
      render();
      expect(component).toMatchSnapshot();
    });

    it('should include document specific options', () => {
      render();
      expect(component).toMatchSnapshot();
    });

    it('should remove all options for relationship', () => {
      props.relationType = true;
      render();
      expect(component).toMatchSnapshot();
    });
  });

  describe('on unmount', () => {
    it('should resetTemplate', () => {
      render();
      component.unmount();
      expect(resetTemplate).toHaveBeenCalledWith();
    });
  });
});