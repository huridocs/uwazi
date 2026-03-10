import { shallow } from 'enzyme';
import React from 'react';
import { Pill } from '../Pill';

describe('Pill', () => {
  it('should render a pill with the provided color and content', () => {
    const component = shallow(<Pill color="red">content</Pill>);
    expect(component.props().style.backgroundColor).toBe('red');
    expect(component.childAt(0).text()).toBe('content');
  });
});
