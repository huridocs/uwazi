import React from 'react';
import {shallow} from 'enzyme';

import SearchInput from 'app/Layout/SearchInput';

describe('SearchInput', () => {
  let component;
  let props;

  let render = () => {
    props = {
      prop1: 'prop1',
      prop2: 'prop2'
    };
    component = shallow(<SearchInput {...props}/>);
  };

  it('should pass all props to the input', () => {
    render();
    let input = component.find('input');

    expect(input.props().prop1).toBe('prop1');
    expect(input.props().prop2).toBe('prop2');
  });
});
