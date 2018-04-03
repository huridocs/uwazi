import React from 'react';

import { shallow } from 'enzyme';

import Tip from '../Tip';

describe('Tip', () => {
  it('should render children inside tooltip classed containers', () => {
    const component = shallow(<Tip>this is  a tip !!</Tip>);
    expect(component).toMatchSnapshot();
  });
});
