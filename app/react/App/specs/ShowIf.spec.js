import React from 'react';
import {shallow} from 'enzyme';

import ShowIf from '../ShowIf';

describe('ShowIf', () => {
  let component;
  let props;

  beforeEach(() => {
    props = {if: true};
  });

  let render = () => {
    component = shallow(<ShowIf {...props}><div/></ShowIf>);
  };

  describe('when if property is true', () => {
    it('should render children', () => {
      render();
      expect(component.find('div').length).toBe(1);
    });
  });

  describe('when if property is false', () => {
    it('should render children', () => {
      props.if = false;
      render();
      expect(component.find('div').length).toBe(0);
    });
  });
});
