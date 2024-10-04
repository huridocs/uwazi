import React from 'react';
import { shallow } from 'enzyme';
import { Icon } from 'UI';
import IconSelectorItem from '../IconSelectorItem';

describe('IconSelectorItem', () => {
  let component;
  let instance;
  let props;

  const render = () => {
    component = shallow(<IconSelectorItem {...props} />);
    instance = component.instance();
  };

  it('should render a fontawesome icon and label', () => {
    props = { item: { _id: 'faicon', type: 'Icons', label: 'Faicon Label' } };
    render();

    expect(component.find(Icon).props().icon).toBe('faicon');
    expect(component.text()).toContain('Faicon Label');
  });

  it('should render a flag and label', () => {
    props = { item: { _id: 'JPN', type: 'Flags', label: 'Flag Label' } };
    render();

    expect(component.find('span.fi').props().className).toContain('fi-jp');
    expect(component.text()).toContain('Flag Label');
  });

  it('should update only if item _id changes', () => {
    props = { item: { _id: 'faicon', type: 'Icons', label: 'Faicon Label' } };
    render();
    expect(instance.shouldComponentUpdate({ item: { _id: 'anothericon' } })).toBe(true);
    expect(instance.shouldComponentUpdate({ item: { _id: 'faicon' } })).toBe(false);
  });
});
