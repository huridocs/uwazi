import React from 'react';

import PropertyConfigOptions from 'app/Templates/components/PropertyConfigOptions';
import { shallow } from 'enzyme';

describe('PropertyConfigOptions', () => {
  let component;
  let props;

  beforeEach(() => {
    props = {
      index: 2,
      type: 'select',
      property: {},
    };
  });

  it('should render fields with the correct datas', () => {
    component = shallow(<PropertyConfigOptions {...props}/>);
    expect(component).toMatchSnapshot();
  });

  describe('Once the property is checked as filter', () => {
    it('should render the default filter option', () => {
      props.property.filter = true;
      component = shallow(<PropertyConfigOptions {...props}/>);
      expect(component).toMatchSnapshot();
    });
  });

  describe('when the are type text', () => {
    it('should render the priority sorting option', () => {
      props.type = 'text';
      component = shallow(<PropertyConfigOptions {...props}/>);
      expect(component).toMatchSnapshot();
    });
  });

  describe('when the are type date', () => {
    it('should render the priority sorting option', () => {
      props.type = 'date';
      component = shallow(<PropertyConfigOptions {...props}/>);
      expect(component).toMatchSnapshot();
    });
  });
});
