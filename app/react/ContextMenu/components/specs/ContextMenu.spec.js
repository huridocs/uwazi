import React from 'react';
import {shallow} from 'enzyme';

import {ContextMenu} from 'app/ContextMenu/components/ContextMenu';
import ViewerDefaultMenu from 'app/Viewer/components/ViewerDefaultMenu';
import ViewerTextSelectedMenu from 'app/Viewer/components/ViewerTextSelectedMenu';

describe('ContextMenu', () => {
  let component;

  let render = (withProps = {}) => {
    component = shallow(<ContextMenu {...withProps}/>);
  };

  describe('when props.open is false', () => {
    it('should render a div without open className', () => {
      render();
      expect(component.find('div').hasClass('active')).toBe(false);
    });
  });

  describe('when prop.open', () => {
    it('should render open className', () => {
      render({open: true});
      expect(component.find('div').hasClass('active')).toBe(true);
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

  describe('Menu rendered', () => {
    describe('when type is null', () => {
      it('should not render any menu', () => {
        let props = {type: null};
        render(props);

        expect(component.find('div').children().length).toBe(0);
      });
    });
    describe('when type is ViewerDefaultMenu', () => {
      it('should render this menu', () => {
        let props = {type: 'ViewerDefaultMenu'};
        render(props);

        expect(component.find(ViewerDefaultMenu).length).toBe(1);
      });
    });
    describe('when type is ViewerTextSelectedMenu', () => {
      it('should render this menu', () => {
        let props = {type: 'ViewerTextSelectedMenu'};
        render(props);

        expect(component.find(ViewerTextSelectedMenu).length).toBe(1);
      });
    });
  });
});
