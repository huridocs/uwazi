import React from 'react';
import {shallow} from 'enzyme';
import Immutable from 'immutable';

import {DocumentForm} from 'app/DocumentForm/components/DocumentForm';
import Select from 'app/DocumentForm/components/Select';
import {Form} from 'react-redux-form';


describe('DocumentForm', () => {
  let component;
  let fieldsTemplate;
  let props;

  beforeEach(() => {
    fieldsTemplate = [{name: 'field1', label: 'label1'}, {name: 'field2', label: 'label2', type: 'select', content: 'thesauriId'}];

    props = {
      document: {_id: 'docId', template: 'templateId', title: 'testTitle', metadata: {field1: 'field1value', field2: 'field2value'}},
      templates: Immutable.fromJS([
        {name: 'template1', _id: 'templateId', properties: fieldsTemplate},
        {name: 'template2', _id: '2', properties: [{name: 'field3'}]}
      ]),
      thesauris: Immutable.fromJS([{_id: 'thesauriId', name: 'thesauri', values: [{label: 'option1', id: '1'}]}]),
      onSubmit: jasmine.createSpy('onSubmit'),
      changeTemplate: jasmine.createSpy('changeTemplate'),
      state: {fields: {title: {prop: 'prop'}}}
    };
  });

  let render = () => {
    component = shallow(<DocumentForm {...props}/>);
  };

  it('should render a form with document as model', () => {
    render();
    let form = component.find(Form);
    expect(form.props().model).toEqual('document');
  });

  it('should render title field as a textarea', () => {
    render();
    let title = component.find('textarea');
    expect(title.props().value).toEqual('testTitle');
  });

  it('should render template as a select', () => {
    render();
    let template = component.find(Select).first();
    expect(template.props().value).toEqual('templateId');
    expect(template.props().options).toEqual([{label: 'template1', value: 'templateId'}, {label: 'template2', value: '2'}]);
  });

  describe('on template change', () => {
    it('should call changeTemplate with the document and the template', () => {
      render();
      let template = component.find(Select).first();
      template.simulate('change', {target: {value: '2'}});
      expect(props.changeTemplate).toHaveBeenCalledWith(props.document, props.templates.toJS()[1]);
    });
  });

  it('should render dynamic fields based on the template selected', () => {
    render();
    let inputField = component.findWhere((node) => node.props().model === 'document.metadata.field1');
    let input = inputField.find('input');
    expect(input.props().value).toBe('field1value');

    let selectField = component.findWhere((node) => node.props().model === 'document.metadata.field2');
    let select = selectField.find(Select);
    expect(select.props().value).toBe('field2value');
    expect(select.props().options).toEqual(props.thesauris.toJS()[0].values);
  });

  describe('submit', () => {
    it('should call onSubmit with the values', () => {
      render();
      component.find(Form).simulate('submit', 'values');
      expect(props.onSubmit).toHaveBeenCalledWith('values');
    });
  });
});
