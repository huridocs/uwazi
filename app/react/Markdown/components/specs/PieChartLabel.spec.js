import React from 'react';

import { shallow } from 'enzyme';

import PieChartLabel from '../PieChartLabel';

describe('PieChart Label', () => {
  it('should render label', () => {
    const props = {
      cx: 500,
      cy: 111,
      data: [{ label: 'label1' }, { label: 'label2' }],
      index: 1,
      value: 30,
      midAngle: 359,
      outerRadius: 105,
      innerRadius: 50,
    };

    const component = shallow(<PieChartLabel {...props} />);
    expect(component).toMatchSnapshot();
  });
});
