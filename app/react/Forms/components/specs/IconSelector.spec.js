import React from 'react';
import { shallow } from 'enzyme';
import countries from 'world-countries';
import { iconNames } from 'UI/Icon/library';
import DropdownList from 'react-widgets/lib/DropdownList';
import IconSelector from '../IconSelector';

describe('IconSelector', () => {
  let component;
  let props;

  const render = () => {
    props = { onChange: 'Function' };
    component = shallow(<IconSelector {...props} />);
  };

  it('should have an empty option', () => {
    render();
    expect(component.find(DropdownList).props().data[0]._id).toBe(null);
    expect(component.find(DropdownList).props().data[0].type).toBe('Empty');
  });

  it('should render a DropdownList with icons and flags, extending passed props', () => {
    render();
    const firstFlagIndex = component.find(DropdownList).props().data.length - countries.length;
    expect(component.find(DropdownList).props().data.length).toBe(
      iconNames.length + countries.length + 1
    );

    expect(component.find(DropdownList).props().data[1].type).toBe('Icons');
    expect(component.find(DropdownList).props().data[1]._id).toBe(iconNames[0]);
    expect(component.find(DropdownList).props().data[1].label).toBe(iconNames[0]);

    expect(component.find(DropdownList).props().data[firstFlagIndex].type).toBe('Flags');
    expect(component.find(DropdownList).props().data[firstFlagIndex]._id).toBe(countries[0].cca3);
    expect(component.find(DropdownList).props().data[firstFlagIndex].label).toBe(
      countries[0].name.common
    );

    expect(component.find(DropdownList).props().defaultValue).toBe(
      component.find(DropdownList).props().data[0]
    );
  });
});
