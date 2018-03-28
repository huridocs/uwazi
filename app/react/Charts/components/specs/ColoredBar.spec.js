import React from 'react';
import { shallow } from 'enzyme';
import { Rectangle } from 'recharts';

import colorScheme, { light as colorSchemeLight } from '../../utils/colorScheme';
import ColoredBar from '../ColoredBar';

describe('ColoredBar', () => {
  let component;
  let props;

  beforeEach(() => {
    props = {};
  });

  const render = () => {
    component = shallow(<ColoredBar {...props} />);
  };

  it('should render a rectangle passing props with the passed index color', () => {
    render();
    const { fill, stroke } = component.find(Rectangle).props();
    expect(fill).toBe(colorScheme[0]);
    expect(stroke).toBe('none');
  });

  it('should allow passing the light color scheme', () => {
    props.color = 'light';
    props.index = 3;
    render();
    const { index, fill } = component.find(Rectangle).props();
    expect(index).toBe(props.index);
    expect(fill).toBe(colorSchemeLight[3]);
  });
});
