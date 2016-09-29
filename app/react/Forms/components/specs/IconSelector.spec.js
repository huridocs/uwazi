import React from 'react';
import {shallow} from 'enzyme';

import IconSelector, {ListItem} from '../IconSelector';
import DropdownList from '../DropdownList';
import Flag from 'react-flags';

import fontawesomeIcons from 'app/utils/fontawesomeIcons';
import countries from 'world-countries';

describe('ListItem', () => {
  let component;
  let instance;
  let props;

  let render = () => {
    component = shallow(<ListItem {...props}/>);
    instance = component.instance();
  };

  it('should render a fontawesome icon and label', () => {
    props = {item: {_id: 'faicon', type: 'Icons', label: 'Faicon Label'}};
    render();

    expect(component.find('i').props().className).toBe('fa fa-faicon');
    expect(component.text()).toBe('Faicon Label');
  });

  it('should render a flag and label', () => {
    props = {item: {_id: 'COUNTRY_CODE', type: 'Flags', label: 'Flag Label'}};
    render();

    expect(component.find(Flag).props().name).toBe('COUNTRY_CODE');
    expect(component.text()).toContain('Flag Label');
  });

  it('should update only if item _id changes', () => {
    props = {item: {_id: 'faicon', type: 'Icons', label: 'Faicon Label'}};
    render();
    expect(instance.shouldComponentUpdate({item: {_id: 'anothericon'}})).toBe(true);
    expect(instance.shouldComponentUpdate({item: {_id: 'faicon'}})).toBe(false);
  });
});

describe('IconSelector', () => {
  let component;
  let props;

  let render = () => {
    props = {onChange: 'Function'};
    component = shallow(<IconSelector {...props}/>);
  };

  it('should have an empty option', () => {
    render();
    expect(component.find(DropdownList).props().data[0]._id).toBe(null);
    expect(component.find(DropdownList).props().data[0].type).toBe('Empty');
  });

  it('should render a DropdownList with icons and flags, extending passed props', () => {
    render();
    const firstFlagIndex = component.find(DropdownList).props().data.length - countries.length;
    expect(component.find(DropdownList).props().data.length).toBe(fontawesomeIcons.length + countries.length + 1);

    expect(component.find(DropdownList).props().data[1].type).toBe('Icons');
    expect(component.find(DropdownList).props().data[1]._id).toBe(fontawesomeIcons[0]);
    expect(component.find(DropdownList).props().data[1].label).toBe(fontawesomeIcons[0]);

    expect(component.find(DropdownList).props().data[firstFlagIndex].type).toBe('Flags');
    expect(component.find(DropdownList).props().data[firstFlagIndex]._id).toBe(countries[0].cca3);
    expect(component.find(DropdownList).props().data[firstFlagIndex].label).toBe(countries[0].name.common);

    expect(component.find(DropdownList).props().valueComponent).toBe(ListItem);
    expect(component.find(DropdownList).props().itemComponent).toBe(ListItem);
    expect(component.find(DropdownList).props().defaultValue).toBe(component.find(DropdownList).props().data[0]);
    expect(component.find(DropdownList).props().onChange).toBe('Function');
  });
});
