import React from 'react';

import {ContextMenu} from 'app/ContextMenu/components/ContextMenu';
import {shallow} from 'enzyme';

describe('ContextMenu', () => {
  let component;

  let render = (withProps = {}) => {
    component = shallow(<ContextMenu {...withProps}/>);
  };

  describe('when props.open is false', () => {
    it('should render a div without open className', () => {
      render();
      expect(component.find('div').hasClass('open')).toBe(false);
    });
  });

  describe('when prop.open', () => {
    it('should render open className', () => {
      render({open: true});
      expect(component.find('div').hasClass('open')).toBe(true);
    });
  });

  describe('on mouseEnter', () => {
    it('should openMenu()', () => {
      let props = {openMenu: jasmine.createSpy('openMenu')};
      render(props);

      component.find('div').simulate('mouseenter');
      expect(props.openMenu).toHaveBeenCalled();
    });
  });

  describe('on mouseleave', () => {
    it('should closeMenu()', () => {
      let props = {closeMenu: jasmine.createSpy('closeMenu')};
      render(props);

      component.find('div').simulate('mouseleave');
      expect(props.closeMenu).toHaveBeenCalled();
    });
  });
});
