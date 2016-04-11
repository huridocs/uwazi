import React from 'react';
import {shallow} from 'enzyme';

import SidePanel from 'app/Layout/SidePanel';

describe('SidePanel', () => {
  let component;

  let render = (props = {}) => {
    component = shallow(<SidePanel {...props}><div></div></SidePanel>);
  };

  it('should render children', () => {
    render();
    expect(component.find('aside').find('div').length).toBe(1);
  });

  it('should be hidden by default', () => {
    render();
    expect(component.find('aside').hasClass('is-hidden')).toBe(true);
  });

  it('should be active if props.open', () => {
    render({open: true});
    expect(component.find('aside').hasClass('is-hidden')).toBe(false);
    expect(component.find('aside').hasClass('is-active')).toBe(true);
  });
});
