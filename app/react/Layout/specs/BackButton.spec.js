import React from 'react';
import { shallow } from 'enzyme';

import BackButton from '../BackButton';

describe('Icon', () => {
  let component;
  let props;

  const render = () => {
    component = shallow(<BackButton {...props} />);
  };

  it('should render the back button to the provided url', () => {
    props = { to: '/some/url', className: 'extra-class' };
    render();
    expect(component).toMatchSnapshot();
  });
});
