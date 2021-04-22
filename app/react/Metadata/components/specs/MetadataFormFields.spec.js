import React from 'react';
import { shallow } from 'enzyme';
import { fromJS } from 'immutable';
import { FormGroup } from 'app/Forms';
import { MetadataFormFields } from '../MetadataFormFields';
import MultipleEditionFieldWarning from '../MultipleEditionFieldWarning';
import { LookupMultiSelect, DatePicker } from '../../../ReactReduxForms';

describe('MetadataFormFields with one entity to edit ', () => {
  let component;
  let fieldsTemplate;
  let props;

  beforeEach(() => {
    fieldsTemplate = [
      { name: 'field1', label: 'label1', type: 'text' },
      { name: 'field2', label: 'label2', type: 'relationship', content: '2' },
      { name: 'field3', label: 'label3', type: 'date' },
      { name: 'field4', label: 'label4', type: 'generatedid' },
    ];

    props = {
      metadata: {
        _id: [{ value: 'docId' }],
        template: [{ value: 'templateId' }],
        title: [{ value: 'testTitle' }],
        metadata: [
          {
            value: {
              field1: 'field1value',
              field2: 'field2value',
            },
          },
        ],
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
    };
  });

  const render = () => {
    component = shallow(<MetadataFormFields {...props} />);
  };

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

    const multiselect = component.find(LookupMultiSelect);
    expect(multiselect.props().options).toEqual(props.thesauris.toJS()[0].values);
    expect(multiselect.props().optionsValue).toEqual('id');

    const datepicker = component.find(DatePicker);
    expect(datepicker.length).toBe(1);

    const generatedIdInput = component.find('[model=".metadata.field4"]').find('input');
    expect(generatedIdInput.length).toBe(1);
  });
});
