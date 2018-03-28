import React from 'react';
import { shallow } from 'enzyme';

import StackedDualBarChart from '../StackedDualBarChart';

describe('StackedDualBarChart', () => {
  let props;

  beforeEach(() => {
    props = {};
  });

  function testSnapshot() {
    const tree = shallow(<StackedDualBarChart {...props} />);
    expect(tree).toMatchSnapshot();
  }

  it('should render a BarChart with default values', () => {
    testSnapshot();
  });

  it('should allow overriding default data and label and map the Legend payload', () => {
    props = {
      data: [{ name: 'd1' }, { name: 'd2' }],
      chartLabel: 'someLabel'
    };

    testSnapshot();
  });
});
