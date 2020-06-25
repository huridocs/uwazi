/** @format */

import React from 'react';
import { shallow } from 'enzyme';
import Immutable from 'immutable';
import { Form, Field } from 'react-redux-form';

import { MetadataForm, mapStateToProps } from '../MetadataForm';
import MetadataFormFields from '../MetadataFormFields';
import { Select as SimpleSelect } from '../../../Forms';

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
      { name: 'field4', label: 'label4', type: 'date' },
    ];

    templates = Immutable.fromJS([
      {
        name: 'template1',
        _id: 'templateId',
        properties: fieldsTemplate,
        commonProperties: [{ name: 'title', label: 'Title' }],
      },
      {
        name: 'template2',
        _id: '2',
        properties: [{ name: 'field3' }],
        commonProperties: [{ name: 'title', label: 'Title' }],
        isEntity: false,
      },
      {
        name: 'template3',
        _id: '3',
        properties: [{ name: 'field4' }],
        commonProperties: [{ name: 'title', label: 'Title' }],
        isEntity: true,
      },
    ]);

    props = {
      metadata: {
        _id: [{ value: 'docId' }],
        template: [{ value: 'templateId' }],
        title: [{ value: 'testTitle' }],
        metadata: [{ value: { field1: 'field1value', field2: 'field2value' } }],
      },
      templates,
      template: templates.get(0),
      templateOptions: Immutable.fromJS([{ label: 'template1', value: 'templateId' }]),
      thesauris: Immutable.fromJS([
        { _id: 2, name: 'thesauri', values: [{ label: 'option1', id: '1' }] },
      ]),
      onSubmit: jasmine.createSpy('onSubmit'),
      changeTemplate: jasmine.createSpy('changeTemplate'),
      model: 'metadata',
    };
  });

  const render = () => {
    component = shallow(<MetadataForm {...props} />);
  };

  describe('Icon field', () => {
    it('should remove icon', () => {});
  });

  it('should render a form with metadata as model', () => {
    render();
    const form = component.find(Form);
    expect(form.props().model).toEqual('metadata');
  });

  it('should display custom title label', () => {
    props.template = Immutable.fromJS({
      name: 'template4',
      _id: 'template4',
      commonProperties: [{ name: 'title', label: 'Name' }],
      properties: [],
    });
    render();
    expect(component).toMatchSnapshot();
  });

  it('should render MetadataFormFields passing thesauris state and template', () => {
    render();
    const formFields = component.find(MetadataFormFields);

    expect(formFields.props().thesauris).toBe(props.thesauris);
    expect(formFields.props().state).toBe(props.state);
    expect(formFields.props().template).toBe(props.templates.get(0));
  });

  it('should pass the model to Form and MetadataFormFields', () => {
    render();
    const form = component.find(Form);
    expect(form.props().model).toBe('metadata');
    const metadataFields = component.find(MetadataFormFields);
    expect(metadataFields.props().model).toBe('metadata');
  });

  it('should render title field as a textarea', () => {
    render();
    expect(component.find(Field)).toMatchSnapshot();
  });

  describe('on template change', () => {
    function assessWarningVisibility(visible) {
      const warning = component.find({
        children: 'Changing the type will erase all connections to this entity.',
      });
      expect(warning.parents().get(1).props.if).toBe(visible);
    }

    it('should call changeTemplate with the template', () => {
      render();
      const template = component.find(SimpleSelect).first();
      template.simulate('change', { target: { value: '2' } });
      expect(props.changeTemplate).toHaveBeenCalledWith(props.model, props.templates.toJS()[1]._id);
    });

    it('should warn about the loss of connections if the entity is already a saved one', () => {
      props.templateId = '2';
      props.initialTemplateId = 'templateId';
      render();
      assessWarningVisibility(true);
    });

    it('should not warn about the loss of connections if the entity is a new one', () => {
      props.templateId = '2';
      props.initialTemplateId = undefined;
      render();
      assessWarningVisibility(false);
    });

    it('should not warn about the loss of connections if the template is the same than the original one', () => {
      props.templateId = 'templateId';
      props.initialTemplateId = 'templateId';
      render();
      assessWarningVisibility(false);
    });
  });

  describe('submit', () => {
    it('should call onSubmit with the values wrapped', () => {
      render();
      const UnwrapedEntity = {
        _id: '123',
        template: '456',
        language: 'en',
        metadata: {
          prop_one: ['one', 'two', 'three'],
          prop_two: 'Doctor who?',
          prop_three: null,
        },
        file: {},
        fullText: [],
      };
      const WrapedEntity = {
        _id: '123',
        template: '456',
        language: 'en',
        metadata: {
          prop_one: [{ value: 'one' }, { value: 'two' }, { value: 'three' }],
          prop_two: [{ value: 'Doctor who?' }],
          prop_three: [{ value: null }],
        },
      };
      component.find(Form).simulate('submit', UnwrapedEntity);
      expect(props.onSubmit).toHaveBeenCalledWith(WrapedEntity, 'metadata');
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
      expect(mapStateToProps(state, ownProps).template).toBe(templates.get(1));
    });
  });
});
