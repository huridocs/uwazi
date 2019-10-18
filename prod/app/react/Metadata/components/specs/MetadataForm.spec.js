"use strict";var _react = _interopRequireDefault(require("react"));
var _enzyme = require("enzyme");
var _immutable = _interopRequireDefault(require("immutable"));
var _reactReduxForm = require("react-redux-form");

var _MetadataForm = require("../MetadataForm");
var _MetadataFormFields = _interopRequireDefault(require("../MetadataFormFields"));
var _Forms = require("../../../Forms");
var _filterBaseProperties = _interopRequireDefault(require("../../../Entities/utils/filterBaseProperties"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}


describe('MetadataForm', () => {
  let component;
  let fieldsTemplate;
  let props;
  let templates;

  beforeEach(() => {
    fieldsTemplate = [
    { name: 'field1', label: 'label1' },
    { name: 'field2', label: 'label2', type: 'select', content: '2' },
    { name: 'field3', label: 'label3', type: 'multiselect', content: '2' },
    { name: 'field4', label: 'label4', type: 'date' }];


    templates = _immutable.default.fromJS([
    { name: 'template1', _id: 'templateId', properties: fieldsTemplate, commonProperties: [{ name: 'title', label: 'Title' }] },
    { name: 'template2', _id: '2', properties: [{ name: 'field3' }], commonProperties: [{ name: 'title', label: 'Title' }], isEntity: false },
    { name: 'template3', _id: '3', properties: [{ name: 'field4' }], commonProperties: [{ name: 'title', label: 'Title' }], isEntity: true }]);


    props = {
      metadata: { _id: 'docId', template: 'templateId', title: 'testTitle', metadata: { field1: 'field1value', field2: 'field2value' } },
      templates,
      template: templates.get(0),
      templateOptions: _immutable.default.fromJS([{ label: 'template1', value: 'templateId' }]),
      thesauris: _immutable.default.fromJS([{ _id: 2, name: 'thesauri', values: [{ label: 'option1', id: '1' }] }]),
      onSubmit: jasmine.createSpy('onSubmit'),
      changeTemplate: jasmine.createSpy('changeTemplate'),
      model: 'metadata' };

  });

  const render = () => {
    component = (0, _enzyme.shallow)(_react.default.createElement(_MetadataForm.MetadataForm, props));
  };

  describe('Icon field', () => {
    it('should remove icon', () => {

    });
  });

  it('should render a form with metadata as model', () => {
    render();
    const form = component.find(_reactReduxForm.Form);
    expect(form.props().model).toEqual('metadata');
  });

  it('should display custom title label', () => {
    props.template = _immutable.default.fromJS({
      name: 'template4',
      _id: 'template4',
      commonProperties: [
      { name: 'title', label: 'Name' }],

      properties: [] });

    render();
    expect(component).toMatchSnapshot();
  });

  it('should render MetadataFormFields passing thesauris state and template', () => {
    render();
    const formFields = component.find(_MetadataFormFields.default);

    expect(formFields.props().thesauris).toBe(props.thesauris);
    expect(formFields.props().state).toBe(props.state);
    expect(formFields.props().template).toBe(props.templates.get(0));
  });

  it('should pass the model to Form and MetadataFormFields', () => {
    render();
    const form = component.find(_reactReduxForm.Form);
    expect(form.props().model).toBe('metadata');
    const metadataFields = component.find(_MetadataFormFields.default);
    expect(metadataFields.props().model).toBe('metadata');
  });

  it('should render title field as a textarea', () => {
    render();
    expect(component.find(_reactReduxForm.Field)).toMatchSnapshot();
  });

  describe('on template change', () => {
    it('should call changeTemplate with the template', () => {
      render();
      const template = component.find(_Forms.Select).first();
      template.simulate('change', { target: { value: '2' } });
      expect(props.changeTemplate).toHaveBeenCalledWith(props.model, props.templates.toJS()[1]._id);
    });
  });

  describe('submit', () => {
    it('should call onSubmit with the values', () => {
      spyOn(_filterBaseProperties.default, 'filterBaseProperties').and.returnValue('filteredProperties');
      render();
      component.find(_reactReduxForm.Form).simulate('submit', 'values');
      expect(_filterBaseProperties.default.filterBaseProperties).toHaveBeenCalledWith('values');
      expect(props.onSubmit).toHaveBeenCalledWith('filteredProperties', 'metadata');
    });
  });

  describe('mapStateToProps', () => {
    let state;
    let ownProps;

    beforeEach(() => {
      state = { templates };
      ownProps = { templates, templateId: templates.get(1).get('_id') };
    });

    it('should return template based on metadata.template', () => {
      expect((0, _MetadataForm.mapStateToProps)(state, ownProps).template).toBe(templates.get(1));
    });
  });
});