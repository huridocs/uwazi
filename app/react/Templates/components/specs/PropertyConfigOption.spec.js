import React from 'react';

import { shallow } from 'enzyme';

import PropertyConfigOption from '../PropertyConfigOption';

describe('Tip', () => {
  it('should render label and input for the model', () => {
    const component = shallow(<PropertyConfigOption model="model" label="label" />);
    expect(component).toMatchSnapshot();
  });

  it('should render children', () => {
    const component = shallow(<PropertyConfigOption model="model" label="label">children text!</PropertyConfigOption>);
    expect(component).toMatchSnapshot();
  });
});
