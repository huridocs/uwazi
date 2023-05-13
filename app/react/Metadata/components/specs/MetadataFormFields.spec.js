import React from 'react';
import { shallow } from 'enzyme';
import * as redux from 'redux';
import { fromJS } from 'immutable';
import { actions as formActions } from 'react-redux-form';

import { FormGroup } from 'app/Forms';
import MultipleEditionFieldWarning from '../MultipleEditionFieldWarning';
import { LookupMultiSelect, DatePicker } from '../../../ReactReduxForms';
import { MetadataFormFields, mapDispatchToProps } from '../MetadataFormFields';
import { AddThesauriValueButton } from '../AddThesauriValueButton';

describe('MetadataFormFields with one entity to edit ', () => {
  let component;
  let fieldsTemplate;
  let props;
  let metadata;

  beforeEach(() => {
    fieldsTemplate = [
      { _id: 1, name: 'field1', label: 'label1', type: 'text' },
      { _id: 2, name: 'field2', label: 'label2', type: 'relationship', content: '2' },
      { _id: 3, name: 'field3', label: 'label3', type: 'date' },
      { _id: 4, name: 'field4', label: 'label4', type: 'generatedid' },
      { _id: 5, name: 'field5', label: 'label5', type: 'relationship', content: '2' },
      { _id: 6, name: 'field6', label: 'label6', type: 'image' },
      { _id: 7, name: 'field7', label: 'label7', type: 'media' },
    ];

    metadata = [
      {
        value: {
          field1: 'field1value',
          field2: 'field2value',
        },
      },
    ];
  });

  const render = args => {
    props = {
      metadata: {
        _id: [{ value: 'docId' }],
        template: [{ value: 'templateId' }],
        title: [{ value: 'testTitle' }],
        metadata,
      },
      template: fromJS({
        name: 'template1',
        _id: 'templateId',
        properties: fieldsTemplate,
      }),
      fields: fromJS(fieldsTemplate),
      thesauris: fromJS([
        {
          _id: 2,
          name: 'thesauri',
          values: [
            {
              label: 'option1',
              id: '1',
            },
          ],
        },
      ]),
      dateFormat: '',
      model: 'metadata',
      storeKey: 'library',
      change: jest.fn(),
      push: () => {},
      saveThesaurus: () => {},
    };

    const componentProps = { ...props, ...args };
    // eslint-disable-next-line react/jsx-props-no-spreading
    component = shallow(<MetadataFormFields {...componentProps} />);
  };

  describe('default props', () => {
    it('should pass the field state to every fields and MultipleEditionFieldWarning', () => {
      render();
      const formGroups = component.find(FormGroup);
      expect(formGroups.at(0).props().model).toBe('.metadata.field1');
      expect(formGroups.at(1).props().model).toBe('.metadata.field2');
      expect(formGroups.at(2).props().model).toBe('.metadata.field3');

      const warnings = component.find(MultipleEditionFieldWarning);
      expect(warnings.at(0).props().model).toBe('metadata');
      expect(warnings.at(0).props().field).toBe('metadata.field1');
      expect(warnings.at(1).props().field).toBe('metadata.field2');
      expect(warnings.at(2).props().field).toBe('metadata.field3');
    });

    it('should render dynamic fields based on the template selected', () => {
      render();
      const inputField = component.find('[model=".metadata.field1"]').find('input');
      expect(inputField.length).toBe(1);

      const multiselect = component.find(LookupMultiSelect).at(0);
      expect(multiselect.props().options).toEqual(props.thesauris.toJS()[0].values);
      expect(multiselect.props().optionsValue).toEqual('id');

      const datepicker = component.find(DatePicker);
      expect(datepicker.length).toBe(1);
    });

    it('should render a generatedid property without a default value', () => {
      render();
      const generatedIdInput = component.find('[model=".metadata.field4"]').find('input');
      expect(generatedIdInput.length).toBe(1);
      expect(generatedIdInput.props().defaultValue).toBe(undefined);
    });

    it('should render media components properly', () => {
      render({ model: 'publicform' });
      const imageField = component.find('[model=".metadata.field6"]').at(0);
      const mediaField = component.find('[model=".metadata.field7"]').at(0);

      expect(imageField.props().className).toBe('image');
      expect(mediaField.props().className).toBe('media');
    });
  });

  it('should hide fields with type generatedId if model is publicform', () => {
    render({ model: 'publicform' });
    const generatedIdField = component.find('[model=".metadata.field4"]').at(0);
    expect(generatedIdField.props().className).toBe(' hidden ');
    const generatedIdInput = component.find('[model=".metadata.field4"]').find('input');
    expect(generatedIdInput.props().defaultValue.length).toBe(12);
  });

  it('updating one field should update the others with the same configuration', () => {
    render({ model: 'publicform' });
    const secondRelationshipField = component.find(LookupMultiSelect).at(1);

    secondRelationshipField.simulate('change', ['123', '456']);
    expect(props.change).toHaveBeenCalledWith('publicform.metadata.field2', ['123', '456']);
  });

  it('should render the add thesauri value when not on public form', () => {
    fieldsTemplate = [
      { _id: 1, name: 'text', label: 'Text', type: 'text' },
      { _id: 2, name: 'select', label: 'Select', type: 'select', content: '2' },
    ];
    metadata = [
      {
        value: {
          text: 'text 1',
          select: 'value 1',
        },
      },
    ];

    render();
    expect(component.find(AddThesauriValueButton).length).toBe(1);

    render({ model: 'publicform' });
    expect(component.find(AddThesauriValueButton).length).toBe(0);
  });

  describe('MapDispatchToProps', () => {
    beforeEach(() => {
      spyOn(redux, 'bindActionCreators');
    });

    it('should allow passing an already-bound change (for LocalForm implementations)', () => {
      const dispatch = {};
      const boundChange = () => {};
      mapDispatchToProps(dispatch, {});

      expect(redux.bindActionCreators).toHaveBeenCalledWith(
        expect.objectContaining({ change: formActions.change }),
        dispatch
      );

      redux.bindActionCreators.calls.reset();

      const mappedProps = mapDispatchToProps(dispatch, { boundChange });
      expect(redux.bindActionCreators).not.toHaveBeenCalled();
      expect(mappedProps.change).toBe(boundChange);
    });
  });
});
