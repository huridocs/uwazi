import React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';
import { ToggleButton } from '../ToggleButton';

describe('Toggle button', () => {
  const component: ShallowWrapper<typeof ToggleButton> = shallow(
    <ToggleButton checked onClick={() => {}} />
  );

  it('should be checked when passing checked=true', () => {
    expect(component.find('input').prop('checked')).toBe(true);
  });

  it('should be unchecked when passing checked=false', () => {
    component.setProps({ checked: false });
    expect(component.find('input').prop('checked')).toBe(false);
  });

  it('should execute the passed function on change', () => {
    const onClickFunction = jasmine.createSpy();
    component.setProps({ onClick: onClickFunction });
    component.find('input').simulate('change');
    expect(onClickFunction).toHaveBeenCalled();
  });
});
