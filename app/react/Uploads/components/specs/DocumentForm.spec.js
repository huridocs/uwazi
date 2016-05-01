import React from 'react';
import {shallow} from 'enzyme';

import {DocumentForm, mapStateToProps} from 'app/Uploads/components/DocumentForm';
import {DynamicFields} from 'app/Form';
import Select from 'app/Form/components/Select';
import Textarea from 'app/Form/components/Textarea';

describe('DocumentForm', () => {
  let component;
  let templates;
  let fieldsTemplate;
  let fields;
  let thesauris;
  let saveDocument = jasmine.createSpy('saveDocument');
  let values = {template: '1'};
  let handleSubmit = (callback) => {
    return callback.bind(null, values);
  };

  beforeEach(() => {
    fieldsTemplate = [{name: 'field1', label: 'label1'}, {name: 'field2', label: 'label2', type: 'select', content: 'thesauriId'}];
    templates = [{name: 'template1', _id: '1', properties: fieldsTemplate}, {name: 'template2', _id: '2', properties: [{name: 'field3'}]}];
    fields = {title: {titleProps: 'prop'}, template: {templateProps: 'prop'}};
    thesauris = [{_id: 'thesauriId', name: 'thesauri', values: [{label: 'option1', id: '1'}]}];
    let initialDoc = {processed: true};
    component = shallow(<DocumentForm
      handleSubmit={handleSubmit}
      saveDocument={saveDocument}
      templates={templates}
      fields={fields}
      values={values}
      thesauris={thesauris}
      initialDoc={initialDoc}
      />);
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

  it('should render DynamicFields based on the template selected', () => {
    let subForm = component.find(DynamicFields);
    expect(subForm.props().template[0]).toEqual(fieldsTemplate[0]);
    expect(subForm.props().template[1].options).toEqual([{label: 'option1', value: '1'}]);
  });

  describe('submit', () => {
    it('should call saveDocument', () => {
      component.find('form').simulate('submit', {preventDefault: () => {}});
      expect(saveDocument).toHaveBeenCalledWith({template: '1'});
    });
  });

  describe('mapStateToProps', () => {
    describe('when state.form.template is not defined', () => {
      it('should use initialValues.template to find the template being used and generate dynamic names', () => {
        let state = {form: {}};
        let props = {initialValues: {template: '1'}, templates};
        let newProps = mapStateToProps(state, props);
        expect(newProps.fields).toEqual(['_id', '_rev', 'title', 'template', 'metadata.field1', 'metadata.field2']);
        expect(newProps.template).toEqual(templates[0]);
      });
    });
    describe('when state.form.template defined', () => {
      it('should use state.form.template to find the template being used and generate dynamic names', () => {
        let state = {form: {document: {template: {value: '2'}}}};
        let props = {initialValues: {template: '1'}, templates};
        let newProps = mapStateToProps(state, props);
        expect(newProps.fields).toEqual(['_id', '_rev', 'title', 'template', 'metadata.field3']);
        expect(newProps.template).toEqual(templates[1]);
      });
    });

    describe('when document has no template', () => {
      it('should use the first template', () => {
        let state = {form: {}};
        let props = {initialValues: {}, templates};
        let newProps = mapStateToProps(state, props);
        expect(newProps.fields).toEqual(['_id', '_rev', 'title', 'template', 'metadata.field1', 'metadata.field2']);
        expect(newProps.template).toEqual(templates[0]);
      });
    });
  });
});
