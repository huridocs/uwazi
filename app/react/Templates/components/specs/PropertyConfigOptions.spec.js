import React from 'react';
import { shallow } from 'enzyme';

import PropertyConfigOptions from '../PropertyConfigOptions';

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

  const expectMatch = () => {
    component = shallow(<PropertyConfigOptions {...props}/>);
    expect(component).toMatchSnapshot();
  };

  it('should render fields with the correct datas', () => {
    expectMatch();
  });

  describe('Once the property is checked as filter', () => {
    it('should render the default filter option', () => {
      props.property.filter = true;
      expectMatch();
    });
  });

  describe('priority sorting option', () => {
    it('should render for text and date', () => {
      props.type = 'text';
      expectMatch();
      props.type = 'date';
      expectMatch();
    });
  });

  describe('Additional options', () => {
    it('should allow to exclude the "use as filter" option', () => {
      props.canBeFilter = false;
      expectMatch();
    });
  });
});
