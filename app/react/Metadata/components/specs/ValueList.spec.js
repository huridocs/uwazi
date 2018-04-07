import React from 'react';

import { shallow } from 'enzyme';

import ValueList from '../ValueList';


describe('ValueList', () => {
  const props = {};

  function testSnapshot() {
    const component = shallow(<ValueList {...props} />);
    expect(component).toMatchSnapshot();
  }

  beforeEach(() => {
    props.property = {
      label: 'label',
      value: [{ value: 'first_value', url: 'url1' }, { value: 'second_value' }, { value: 'third value', url: 'url2' }]
    };
  });

  it('should render the values as a ul list', () => {
    testSnapshot();
  });

  it('should rendern icons when the value has one', () => {
    props.property = {
      label: 'label',
      value: [
        { value: 'first_value', url: 'url1', icon: { icon: 'icon' } },
        { value: 'second_value', icon: { icon: 'icon2' } },
        { value: 'third value', url: 'url2' }
      ]
    };
    testSnapshot();
  });

  describe('compact render', () => {
    function testMultilineCase(type) {
      props.property.type = type;
      props.compact = true;
      testSnapshot();
    }

    beforeEach(() => {
      props.property = {
        label: 'label',
        value: [{ value: 'first_value', }, { value: 'second_value' }, { value: 'third value', }]
      };
    });

    it('should render array values separated by ", "', () => {
      props.compact = true;
      testSnapshot();
    });

    it('should render multidaterange in multiple lines', () => {
      testMultilineCase('multidaterange');
    });

    it('should render multidate in multiple lines', () => {
      testMultilineCase('multidate');
    });

    it('should rendern icons when the value has one', () => {
      props.property = {
        label: 'label',
        value: [
          { value: 'first_value' },
          { value: 'second_value', icon: { icon: 'icon2' } },
          { value: 'third value' }
        ]
      };
      props.compact = true;
      testSnapshot();
    });
  });
});
