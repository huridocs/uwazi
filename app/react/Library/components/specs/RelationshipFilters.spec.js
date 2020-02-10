import React from 'react';

import { shallow } from 'enzyme';

import RelationshipFilter from '../RelationshipFilter';

describe('RelationshipFilter', () => {
  it('should render a text filter field with a label and passing the model', () => {
    const props = {
      label: 'label',
      model: 'model',
      property: { name: 'name', filters: [{ name: 'text' }] },
      translationContext: 'context',
      storeKey: 'storeKey',
    };

    const component = shallow(<RelationshipFilter {...props} />);
    expect(component).toMatchSnapshot();
  });
});
