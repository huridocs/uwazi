import React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';
import { ToggleChildren } from '../ToggleChildren';

describe('Toggle children', () => {
  let component: ShallowWrapper<typeof ToggleChildren> = shallow(
    <ToggleChildren toggled={false} />
  );

  it('should not display children if not toggled', () => {
    expect(component.find('.toggle-children-children').text()).toBe('');
  });

  it('should display nothing if children are not passed', () => {
    component = shallow(<ToggleChildren toggled />);
    expect(component.find('.toggle-children-children').text()).toBe('');
  });

  it('should display children if toggled', () => {
    component = shallow(
      <ToggleChildren toggled>
        <p>Content</p>
      </ToggleChildren>
    );
    expect(component.find('.toggle-children-children').text()).toBe('Content');
  });

  it('should not display children if showChildren is false', () => {
    component = shallow(
      <ToggleChildren toggled showChildren={false}>
        <p>Content</p>
      </ToggleChildren>
    );
    expect(component.find('.toggle-children-children').prop('style')).toHaveProperty(
      'display',
      'none'
    );
  });
});
