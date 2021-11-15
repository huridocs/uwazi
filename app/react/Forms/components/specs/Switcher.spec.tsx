import React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';
import { Translate } from 'app/I18N';
import { Switcher, SwitcherProps } from '../Switcher';

describe('Switcher', () => {
  let component: ShallowWrapper<typeof Switcher>;
  let props: SwitcherProps;

  beforeEach(() => {
    props = {
      value: true,
      onChange: jasmine.createSpy('onChange'),
      prefix: 'my',
    };
  });

  const render = (customProps: Partial<SwitcherProps> = {}) => {
    const componentProps = { ...props, ...customProps };
    component = shallow(<Switcher {...componentProps} />);
  };

  it('should render an input with the value and prefix passed', () => {
    render();
    const input = component.find('input');
    expect(input.props().checked).toBe(true);
    expect(input.props().id).toBe('myswitcher');
    const label = component.find('label');
    expect(label.props().htmlFor).toBe('myswitcher');
  });

  describe('onChange', () => {
    it('should return the value in timestamp', () => {
      render();
      const input = component.find('input');
      input.simulate('change', { target: { checked: false } });
      expect(props.onChange).toHaveBeenCalledWith(false);
    });
  });

  it('should receive alternative elements for values', () => {
    render({ leftLabel: <Translate>ALL</Translate>, rightLabel: <Translate>NONE</Translate> });
    const labels = component.find('Connect(Translate)');
    expect(labels.at(0).props().children).toEqual('ALL');
    expect(labels.at(1).props().children).toEqual('NONE');
  });

  it('should receive alternative labels for values', () => {
    render({ leftLabel: 'ALL', rightLabel: 'NONE' });
    const labels = component.find('span');
    expect(labels.at(0).props().children).toEqual('ALL');
    expect(labels.at(1).props().children).toEqual('NONE');
  });

  it('should render default labels AND/OR', () => {
    render();
    const labels = component.find('Connect(Translate)');
    expect(labels.at(0).props().children).toEqual('AND');
    expect(labels.at(1).props().children).toEqual('OR');
  });
});
