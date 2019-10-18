"use strict";var _react = _interopRequireDefault(require("react"));
var _enzyme = require("enzyme");
var _immutable = _interopRequireDefault(require("immutable"));

var _ContextMenu = require("../../../ContextMenu");
var _MetadataPanelMenu = require("../MetadataPanelMenu");function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('MetadataPanelMenu', () => {
  let component;
  let props;

  const render = () => {
    component = (0, _enzyme.shallow)(_react.default.createElement(_MetadataPanelMenu.MetadataPanelMenu, props));
  };

  describe('when document is not being edited', () => {
    it('should open viewReferencesPanel on click references button', () => {
      props = {
        doc: _immutable.default.fromJS({ _id: 1 }),
        templates: _immutable.default.fromJS({ templates: 'tempaltes' }),
        loadInReduxForm: jasmine.createSpy('loadInReduxForm') };

      render();

      component.find(_ContextMenu.MenuButtons.Main).simulate('click');
      expect(props.loadInReduxForm).toHaveBeenCalledWith('documentViewer.docForm', props.doc.toJS(), props.templates.toJS());
    });
  });

  describe('when document is being edited', () => {
    it('should submit documentForm form', () => {
      props = {
        docForm: { _id: 1 },
        doc: _immutable.default.fromJS({ _id: 1 }),
        templates: { templates: 'tempaltes' },
        saveDocument: jasmine.createSpy('saveDocument'),
        formState: { dirty: false } };

      render();

      const button = component.find(_ContextMenu.MenuButtons.Main).find('button');
      expect(button.props().form).toBe('metadataForm');
    });

    describe('when form is pristine', () => {
      it('should disable the buttons', () => {
        props = {
          docForm: { _id: 1 },
          formState: { dirty: false } };

        render();

        const mainButton = component.find(_ContextMenu.MenuButtons.Main);
        expect(mainButton.props().disabled).toBe(true);
        const submitButton = component.find(_ContextMenu.MenuButtons.Main).find('button');
        expect(submitButton.props().disabled).toBe(true);
      });
    });

    describe('when form is dirty', () => {
      it('should not disable the buttons', () => {
        props = {
          docForm: { _id: 1 },
          formState: { dirty: true } };

        render();

        const mainButton = component.find(_ContextMenu.MenuButtons.Main);
        expect(mainButton.props().disabled).toBe(false);
        const submitButton = mainButton.find('button');
        expect(submitButton.props().disabled).toBe(false);
      });
    });
  });
});