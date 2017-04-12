import React from 'react';
import {shallow} from 'enzyme';
import Immutable from 'immutable';

import {MetadataForm, mapStateToProps} from '../MetadataForm';
import MetadataFormFields from '../MetadataFormFields';
import {Form, Field} from 'react-redux-form';
import {Select as SimpleSelect} from 'app/Forms';
import {IconSelector} from 'app/ReactReduxForms';


describe('MetadataForm', () => {
  let component;
  let fieldsTemplate;
  let props;
  let templates;

  beforeEach(() => {
    fieldsTemplate = [
      {name: 'field1', label: 'label1'},
      {name: 'field2', label: 'label2', type: 'select', content: '2'},
      {name: 'field3', label: 'label3', type: 'multiselect', content: '2'},
      {name: 'field4', label: 'label4', type: 'date'}
    ];

    templates = Immutable.fromJS([
      {name: 'template1', _id: 'templateId', properties: fieldsTemplate},
      {name: 'template2', _id: '2', properties: [{name: 'field3'}], isEntity: false},
      {name: 'template3', _id: '3', properties: [{name: 'field4'}], isEntity: true}
    ]);

    props = {
      metadata: {_id: 'docId', template: 'templateId', title: 'testTitle', metadata: {field1: 'field1value', field2: 'field2value'}},
      templates,
      template: templates.get(0),
      templateOptions: Immutable.fromJS([]),
      thesauris: Immutable.fromJS([{_id: 2, name: 'thesauri', values: [{label: 'option1', id: '1'}]}]),
      onSubmit: jasmine.createSpy('onSubmit'),
      changeTemplate: jasmine.createSpy('changeTemplate'),
      state: {title: {titleProp: 'prop'}, metadata: {field1: {field1Prop: 'prop'}}},
      model: 'metadata'
    };
  });

  let render = () => {
    component = shallow(<MetadataForm {...props}/>);
  };

  it('should render a form with metadata as model', () => {
    render();
    let form = component.find(Form);
    expect(form.props().model).toEqual('metadata');
  });

  it('should render MetadataFormFields passing thesauris state and template', () => {
    render();
    let formFields = component.find(MetadataFormFields);

    expect(formFields.props().thesauris).toBe(props.thesauris);
    expect(formFields.props().state).toBe(props.state);
    expect(formFields.props().template).toBe(props.templates.get(0));
  });

  it('should pass the field state to every fields', () => {
    render();
    let FormGroup = component.findWhere((node) => node.props().titleProp === 'prop');
    expect(FormGroup.length).toBe(1);
  });

  it('should render title field as a textarea', () => {
    render();
    let title = component.find('textarea').closest(Field);
    expect(title.props().model).toEqual('.title');
  });

  it('should render an icon selector linked to the icon property', () => {
    render();
    let iconSelector = component.find(IconSelector);
    expect(iconSelector.props().model).toBe('.icon');
  });

  describe('on template change', () => {
    it('should call changeTemplate with the template', () => {
      render();
      let template = component.find(SimpleSelect).first();
      template.simulate('change', {target: {value: '2'}});
      expect(props.changeTemplate).toHaveBeenCalledWith(props.model, props.templates.toJS()[1]._id);
    });
  });

  describe('submit', () => {
    it('should call onSubmit with the values', () => {
      render();
      component.find(Form).simulate('submit', 'values');
      expect(props.onSubmit).toHaveBeenCalledWith('values');
    });
  });

  describe('mapStateToProps', () => {
    let state;
    let ownProps;

    beforeEach(() => {
      state = {templates};
      ownProps = {templates: templates, templateId: templates.get(1).get('_id')};
    });

    it('should select templateOptions according to entity type', () => {
      let expectedOptions = [{label: 'template1', value: 'templateId'}, {label: 'template2', value: '2'}];
      expect(mapStateToProps(state, ownProps).templateOptions.toJS()).toEqual(expectedOptions);

      ownProps.isEntity = true;
      expectedOptions = [{label: 'template3', value: '3'}];
      expect(mapStateToProps(state, ownProps).templateOptions.toJS()).toEqual(expectedOptions);
    });

    it('should return template based on metadata.template', () => {
      expect(mapStateToProps(state, ownProps).template).toBe(templates.get(1));
    });
  });
});
