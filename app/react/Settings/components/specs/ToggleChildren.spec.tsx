import React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';
import { ToggleChildren } from '../ToggleChildren';

describe('Toggle children', () => {
  let component: ShallowWrapper<typeof ToggleChildren>;

  beforeEach(() => {
    component = shallow(
      <ToggleChildren toggled={false}>
        <span>Children</span>
      </ToggleChildren>
    );
  });

  it('should not display children if not toggled', () => {
    expect(component.find('.toggle-children-children').props().style?.display).toBe('none');
  });

  it('should display nothing if children are not passed', () => {
    component = shallow(<ToggleChildren toggled />);
    expect(component.find('.toggle-children-children').text()).toBe('');
  });

  it('should display children if toggled', () => {
    component.find('ToggleButton').simulate('click');
    expect(component.find('.toggle-children-children').props().style?.display).toBe('block');
  });
});
