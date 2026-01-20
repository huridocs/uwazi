import React from 'react';

import { shallow } from 'enzyme';

import DateFilter from '#app/Library/components/DateFilter.jsx';

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
