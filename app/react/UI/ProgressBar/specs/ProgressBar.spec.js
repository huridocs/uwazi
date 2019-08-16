import React from 'react';
import { shallow } from 'enzyme';

import ProgressBar from '../ProgressBar';

describe('ProgressBar', () => {
  it('should render progress bar as value percentage of max', () => {
    const component = shallow(<ProgressBar value={200} max={250} />);
    expect(component).toMatchSnapshot();
  });
});
