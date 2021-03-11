import React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';

import { Translate } from 'app/I18N';
import { Tip } from 'app/Layout';
import { SettingsFormElement, ComponentProps } from '../SettingsFormElement';
import { SettingsLabel } from '../SettingsLabel';

describe('SettingsFromElement', () => {
  let component: ShallowWrapper<typeof SettingsFormElement>;

  const render = (
    { tip, labelClassName, inputsClassName }: Partial<ComponentProps>,
    children: React.ReactNode = null
  ) => {
    component = shallow(
      <SettingsFormElement
        label="Form label"
        tip={tip}
        labelClassName={labelClassName}
        inputsClassName={inputsClassName}
      >
        {children}
      </SettingsFormElement>
    );
  };

  it('should wrap component on form-element div and assign label', () => {
    render({});
    const wrapper = component.find('div').at(0);
    const label = component.find(SettingsLabel).find(Translate);
    expect(wrapper.props().className).toBe('form-element row');
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

  it('should allow overriding classes for label and inputs', () => {
    render({ labelClassName: 'col-xs-4', inputsClassName: 'col-xs-8' });
    const label = component.find(SettingsLabel);
    const inputs = component.find('.form-element-inputs');
    expect(label.props().className).toBe('col-xs-4');
    expect(inputs.props().className).toBe('form-element-inputs col-xs-8');
  });
});
