import React from 'react';
import {shallow} from 'enzyme';
import Immutable from 'immutable';

import {FormConfigSelect} from 'app/Templates/components/FormConfigSelect';
import {FormField, Select} from 'app/Forms';

describe('FormConfigSelect', () => {
  let component;
  let thesauris;

  beforeEach(() => {
    thesauris = [{_id: 1, name: 'thesauri1'}, {_id: 2, name: 'thesauri2'}];
    let props = {
      ui: Immutable.fromJS({thesauris}),
      index: 0
    };

    component = shallow(<FormConfigSelect {...props}/>);
  });

  it('should render FormFields with the correct models', () => {
    const formFields = component.find(FormField);
    expect(formFields.nodes[0].props.model).toBe('template.model.properties[0].label');
    expect(formFields.nodes[1].props.model).toBe('template.model.properties[0].content');
    expect(formFields.nodes[2].props.model).toBe('template.model.properties[0].required');
    expect(formFields.nodes[3].props.model).toBe('template.model.properties[0].filter');
  });

  it('should render the select with the thesauris', () => {
    expect(component.find(Select).node.props.options).toEqual(thesauris);
  });
});
