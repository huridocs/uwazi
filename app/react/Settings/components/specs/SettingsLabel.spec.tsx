import React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';

import { SettingsLabel, SettingsLabelProps } from '../SettingsLabel';

describe('Settings Label', () => {
  let component: ShallowWrapper<typeof SettingsLabel>;

  const render = (className: SettingsLabelProps['className'] = '') => {
    component = shallow(
      <SettingsLabel className={className}>
        <span>Test</span>
      </SettingsLabel>
    );
  };

  it('should wrap children inside a label element', () => {
    render();
    expect(component.find('label').props().className).toBe('inline-form-label ');
    expect(component.find('label').children().at(0).text()).toBe('Test');
  });

  it('should add passed className if found', () => {
    render('col-3');
    expect(component.find('label').props().className).toContain('col-3');
  });
});
