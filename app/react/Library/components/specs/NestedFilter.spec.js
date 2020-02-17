import Immutable from 'immutable';
import React from 'react';

import { shallow } from 'enzyme';

import NestedFilter from '../NestedFilter';

describe('NestedFilter', () => {
  it('should render a text filter field with a label and passing the model', () => {
    const props = {
      label: 'label',
      model: 'model',
      property: { name: 'property' },
      aggregations: Immutable.fromJS({ aggregations: 1 }),
    };

    const component = shallow(<NestedFilter {...props} />);
    expect(component).toMatchSnapshot();
  });
});
