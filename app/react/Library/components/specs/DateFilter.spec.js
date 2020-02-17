import React from 'react';

import { shallow } from 'enzyme';

import DateFilter from '../DateFilter';

describe('DateFilter', () => {
  it('should render a date filter field with a label and passing the model and format', () => {
    const props = {
      label: 'label',
      model: 'model',
      format: 'format',
    };

    const component = shallow(<DateFilter {...props} />);
    expect(component).toMatchSnapshot();
  });
});
