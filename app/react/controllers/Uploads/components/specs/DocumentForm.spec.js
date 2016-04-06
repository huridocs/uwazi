import React from 'react';
import {shallow} from 'enzyme';

import Form from 'app/Form';
import {DocumentForm} from 'app/controllers/Uploads/components/DocumentForm';
import Input from 'app/Form/components/Input';
import Select from 'app/Form/components/Select';
import Textarea from 'app/Form/components/Textarea';

describe('DocumentForm', () => {
  let component;
  let templates;
  let fieldsConfig;
  let fields;
  let thesauris;

  beforeEach(() => {
    fieldsConfig = [{name: 'field1', label: 'label1'}, {name: 'field2', label: 'label2', type: 'select', content: 'thesauriId'}];
    templates = [{name: 'template1', _id: '1', properties: fieldsConfig}, {name: 'template2', _id: '2'}];
    fields = {title: {titleProps: 'prop'}, template: {templateProps: 'prop'}};
    thesauris = [{_id: 'thesauriId', name: 'thesauri', values: [{label: 'option1', id: '1'}]}];
    let values = {template: '1'};
    component = shallow(<DocumentForm templates={templates} fields={fields} values={values} thesauris={thesauris}/>);
  });

  it('should render title field as a textarea', () => {
    let title = component.find(Textarea);
    expect(title.props().properties).toEqual({titleProps: 'prop'});
  });

  it('should render template as a select', () => {
    let template = component.find(Select);
    expect(template.props().properties).toEqual({templateProps: 'prop'});
    expect(template.props().options).toEqual([{label: 'template1', value: '1'}, {label: 'template2', value: '2'}]);
  });

  it('should render template as a select', () => {
    let template = component.find(Select);
    expect(template.props().properties).toEqual({templateProps: 'prop'});
    expect(template.props().options).toEqual([{label: 'template1', value: '1'}, {label: 'template2', value: '2'}]);
  });

  it('should render a form with fieldsConfig based on the template selected', () => {
    let subForm = component.find(Form);
    expect(subForm.props().fieldsConfig[0]).toEqual(fieldsConfig[0]);
    expect(subForm.props().fieldsConfig[1].options).toEqual([{label: 'option1', value: '1'}]);
    expect(subForm.props().form).toEqual('document');
    expect(subForm.props().formKey).toEqual('metadata');
  });
});
