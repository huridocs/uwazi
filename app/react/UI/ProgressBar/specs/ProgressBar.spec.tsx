import React from 'react';
import { shallow } from 'enzyme';

import ProgressBar from '../ProgressBar';

describe('ProgressBar', () => {
  it('should render progress bar as value percentage of max', () => {
    const component = shallow(<ProgressBar value={200} max={250} />);
    expect(component).toMatchSnapshot();
  });

  describe('colors', () => {
    it('should show colors when enabled based on percentage', () => {
      const component = shallow(<ProgressBar value={3} max={10} useProgressColors />);
      expect(component).toMatchSnapshot();
    });
  });

  describe('numeric value', () => {
    it('should show it by default', () => {
      const component = shallow(<ProgressBar value={3} max={10} />);
      expect(component).toMatchSnapshot();
    });
  });
});
