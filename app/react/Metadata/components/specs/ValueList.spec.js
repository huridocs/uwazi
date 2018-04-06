import React from 'react';

import { shallow } from 'enzyme';

import ValueList from '../ValueList';


describe('ValueList', () => {
  let props;

  function testSnapshot() {
    const component = shallow(<ValueList {...props} />);
    expect(component).toMatchSnapshot();
  }

  beforeEach(() => {
    props = {};
  });

  it('should render the values as a ul list', () => {
    props.property = {
      label: 'label',
      value: [{ value: 'first_value', url: 'url1' }, { value: 'second_value' }, { value: 'third value', url: 'url2' }]
    };
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
    it('should render array values separated by ", "', () => {
      props.property = {
        label: 'label',
        value: [{ value: 'first_value', url: 'url1' }, { value: 'second_value' }, { value: 'third value', url: 'url2' }]
      };
      props.compact = true;
      testSnapshot();
    });

    it('should render multidaterange in multiple lines', () => {
      props.property = {
        label: 'label',
        type: 'multidaterange',
        value: [{ value: 'first_value', }, { value: 'second_value' }, { value: 'third value', }]
      };
      props.compact = true;
      testSnapshot();
    });

    it('should render multidate in multiple lines', () => {
      props.property = {
        label: 'label',
        type: 'multidate',
        value: [{ value: 'first_value', }, { value: 'second_value' }, { value: 'third value', }]
      };
      props.compact = true;
      testSnapshot();
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
