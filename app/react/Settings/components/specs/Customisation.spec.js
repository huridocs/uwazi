import React from 'react';

import { shallow } from 'enzyme';

import Customisation from '../Customisation';

describe('Customisation', () => {
  it('should render Customisation component', () => {
    const component = shallow(<Customisation />);
    expect(component).toMatchSnapshot();
  });
});
