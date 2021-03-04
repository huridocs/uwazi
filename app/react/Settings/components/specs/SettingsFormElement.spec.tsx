import React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';

import { Translate } from 'app/I18N';
import { Tip } from 'app/Layout';
import { SettingsFormElement } from '../SettingsFormElement';
import { SettingsLabel } from '../SettingsLabel';

describe('SettingsFromElement', () => {
  let component: ShallowWrapper<typeof SettingsFormElement>;

  const render = ({ tip }: { tip?: JSX.Element }, children: React.ReactNode = null) => {
    component = shallow(
      <SettingsFormElement label="Form label" tip={tip}>
        {children}
      </SettingsFormElement>
    );
  };

  it('should wrap component on form-element div and assign label', () => {
    render({});
    const wrapper = component.find('div').at(0);
    const label = component.find(SettingsLabel).find(Translate);
    expect(wrapper.props().className).toBe('form-element');
    expect(label.children().text()).toBe('Form label');
  });

  it('should allow passing an extra tip to the component', () => {
    render({ tip: <>Some tip</> });
    const tipElement = component.find(SettingsLabel).find(Tip);
    expect(tipElement.props().icon).toBe('info-circle');
    expect(tipElement.props().children.props.children).toBe('Some tip');
  });

  it('should wrap children into the form-element-inputs div', () => {
    const expectedChildren = <span>Form Inputs</span>;
    render({}, expectedChildren);
    const children = component.find('div.form-element-inputs').children();
    expect(children.equals(expectedChildren)).toBe(true);
  });
});
