import React from 'react';

import { shallow } from 'enzyme';

import NumberRangeFilter from '../NumberRangeFilter';

describe('NumberRangeFilter', () => {
  it('should render a NumberRangeFilter filter field with a label and passing the model', () => {
    const props = {
      label: 'label',
      model: 'model',
    };

    const component = shallow(<NumberRangeFilter {...props} />);
    expect(component).toMatchSnapshot();
  });
});
