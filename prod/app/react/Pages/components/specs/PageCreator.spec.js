"use strict";var _react = _interopRequireDefault(require("react"));
var _enzyme = require("enzyme");

var _reactReduxForm = require("react-redux-form");
var _ReactReduxForms = require("../../../ReactReduxForms");
var _PageCreator = require("../PageCreator");function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('PageCreator', () => {
  let component;
  let props;

  beforeEach(() => {
    props = {
      page: { data: { title: 'Page title', metadata: {} } },
      formState: { title: {}, $form: { errors: {} } },
      savePage: jasmine.createSpy('savePage'),
      resetPage: jasmine.createSpy('deletePage') };

  });

  const render = () => {
    component = (0, _enzyme.shallow)(_react.default.createElement(_PageCreator.PageCreator, props));
  };

  describe('render', () => {
    it('should render the creator form which saves on submit', () => {
      render();
      expect(component.find(_reactReduxForm.Form).props().onSubmit).toBe(props.savePage);
    });

    it('should disable saving while savingPage', () => {
      props.savingPage = true;
      render();
      expect(component.find('button').first().props().disabled).toBe(true);
    });

    it('should have a title field associated to the page title', () => {
      render();
      expect(component.find(_reactReduxForm.Field).first().props().model).toBe('.title');
      expect(component.find(_reactReduxForm.Field).first().parent().props().className).toBe('template-name form-group');
    });

    it('should hold the different input fields', () => {
      render();
      expect(component.find(_ReactReduxForms.MarkDown).props().model).toBe('.metadata.content');
      expect(component.find('textarea').parent().props().model).toBe('.metadata.script');
    });

    describe('when Title is invalid', () => {
      it('should add the has-error class to the title input', () => {
        props.formState.title.valid = false;
        props.formState.title.touched = true;
        render();
        expect(component.find(_reactReduxForm.Field).first().parent().props().className).toBe('template-name form-group has-error');
      });
    });
  });

  describe('on componentWillUnmount', () => {
    beforeEach(() => {
      render();
      component.instance().componentWillUnmount();
    });

    it('should reset the page', () => {
      expect(props.resetPage).toHaveBeenCalled();
    });
  });
});