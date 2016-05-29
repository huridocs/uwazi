import React from 'react';
import {shallow} from 'enzyme';

import {FormConfigInput} from 'app/Templates/components/FormConfigInput';
import {FormField} from 'app/Forms';

describe('FormConfigInput', () => {
  let component;
  let props;

  function renderComponent(label = 'test', type = 'text') {
    props = {
      type,
      index: 0,
      templates: [
        {_id: 'template1', properties: [
          {localID: 1, label: label, filter: true, type},
          {localID: 2, label: 'something else'}
        ]},
        {_id: 'template2', name: 'Template 2', properties: [
          {label: 'Date', type: 'date', filter: true},
          {label: 'Author', type: 'text', filter: true}
        ]},
        {_id: 'template3', name: 'Template 3', properties: [
          {label: 'Date', type: 'date', filter: true},
          {label: 'Keywords', type: 'text', filter: true}
        ]}
      ]
    };

    component = shallow(<FormConfigInput {...props}/>);
  }

  beforeEach(renderComponent);

  it('should render FormFields with the correct models', () => {
    const formFields = component.find(FormField);
    expect(formFields.nodes[0].props.model).toBe('template.model.properties[0].label');
    expect(formFields.nodes[1].props.model).toBe('template.model.properties[0].required');
    expect(formFields.nodes[2].props.model).toBe('template.model.properties[0].filter');
  });
});
