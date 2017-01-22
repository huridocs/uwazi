import React from 'react';
import {shallow} from 'enzyme';

import Nested from '../Nested';
import MarkDown from '../MarkDown';

describe('Nested', () => {
  let component;
  let props;

  beforeEach(() => {
    props = {
      label: 'input label',
      value: [
        {prop1: ['1', '2'], prop2: ['1', '2']},
        {prop1: ['2.1', '3'], prop2: ['2']}
      ],
      onChange: jasmine.createSpy()
    };
  });

  let render = () => {
    component = shallow(<Nested {...props}/>);
  };

  it('should render a markdown with the pased value', () => {
    render();
    let markdown = component.find(MarkDown);
    expect(markdown.length).toBe(1);
    expect(markdown.props().value).toBe('| prop1 | prop2 |\n| - | - |\n| 1,2 | 1,2 |\n| 2.1,3 | 2 |');
  });

  describe('onChange', () => {
    it('should parse the markdown value in to an object', () => {
      render();
      let markdown = component.find(MarkDown);
      markdown.simulate('change', {target: {value: '|prop1 | prop2\n|- | -|\n|1,2 | 1,2|\n|2.1,3 | 2|'}});
      expect(props.onChange).toHaveBeenCalledWith([
        {prop1: [ '1', '2' ], prop2: [ '1', '2' ]},
        {prop1: ['2.1', '3'], prop2: ['2']}
      ]);
    });
  });
});
