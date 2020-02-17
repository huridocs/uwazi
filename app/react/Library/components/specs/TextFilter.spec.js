import React from 'react';

import { shallow } from 'enzyme';

import TextFilter from '../TextFilter';

describe('TextFilter', () => {
  it('should render a text filter field with a label and passing the model', () => {
    const props = {
      label: 'label',
      model: 'model',
    };

    const component = shallow(<TextFilter {...props} />);
    expect(component).toMatchSnapshot();
  });
});
