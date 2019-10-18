"use strict";var _react = _interopRequireDefault(require("react"));
var _enzyme = require("enzyme");
var _immutable = require("immutable");
var _Forms = require("../../../Forms");
var _MetadataFormFields = require("../MetadataFormFields");
var _MultipleEditionFieldWarning = _interopRequireDefault(require("../MultipleEditionFieldWarning"));
var _ReactReduxForms = require("../../../ReactReduxForms");function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('MetadataFormFields', () => {
  let component;
  let fieldsTemplate;
  let props;

  beforeEach(() => {
    fieldsTemplate = [
    { name: 'field1', label: 'label1' },
    { name: 'field2', label: 'label2', type: 'relationship', content: '2' },
    { name: 'field3', label: 'label3', type: 'date' }];


    props = {
      metadata: { _id: 'docId', template: 'templateId', title: 'testTitle', metadata: { field1: 'field1value', field2: 'field2value' } },
      template: (0, _immutable.fromJS)({ name: 'template1', _id: 'templateId', properties: fieldsTemplate }),
      fields: (0, _immutable.fromJS)(fieldsTemplate),
      thesauris: (0, _immutable.fromJS)([{ _id: 2, name: 'thesauri', values: [{ label: 'option1', id: '1' }] }]),
      dateFormat: '',
      model: 'metadata' };

  });

  const render = () => {
    component = (0, _enzyme.shallow)(_react.default.createElement(_MetadataFormFields.MetadataFormFields, props));
  };

  it('should pass the field state to every fields and MultipleEditionFieldWarning', () => {
    render();

    const formGroups = component.find(_Forms.FormGroup);
    expect(formGroups.at(0).props().model).toBe('.metadata.field1');
    expect(formGroups.at(1).props().model).toBe('.metadata.field2');
    expect(formGroups.at(2).props().model).toBe('.metadata.field3');

    const warnings = component.find(_MultipleEditionFieldWarning.default);
    expect(warnings.at(0).props().model).toBe('metadata');
    expect(warnings.at(0).props().field).toBe('metadata.field1');
    expect(warnings.at(1).props().field).toBe('metadata.field2');
    expect(warnings.at(2).props().field).toBe('metadata.field3');
  });

  it('should render dynamic fields based on the template selected', () => {
    render();
    const inputField = component.findWhere(node => node.props().model === '.metadata.field1');
    const input = inputField.find('input');
    expect(input).toBeDefined();

    const multiselect = component.find(_ReactReduxForms.MultiSelect);
    expect(multiselect.props().options).toEqual(props.thesauris.toJS()[0].values);
    expect(multiselect.props().optionsValue).toEqual('id');

    const datepicker = component.find(_ReactReduxForms.DatePicker);
    expect(datepicker.length).toBe(1);
  });
});