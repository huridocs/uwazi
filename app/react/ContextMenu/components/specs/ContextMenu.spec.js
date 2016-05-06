import React from 'react';
import {shallow} from 'enzyme';

import {ContextMenu} from 'app/ContextMenu/components/ContextMenu';
import ViewerDefaultMenu from 'app/Viewer/components/ViewerDefaultMenu';
import ViewerTextSelectedMenu from 'app/Viewer/components/ViewerTextSelectedMenu';
import ViewerSaveReferenceMenu from 'app/Viewer/components/ViewerSaveReferenceMenu';
import ViewerSaveTargetReferenceMenu from 'app/Viewer/components/ViewerSaveTargetReferenceMenu';
import UploadsMenu from 'app/Uploads/components/UploadsMenu';
import LibraryMenu from 'app/Library/components/LibraryMenu';

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

  describe('on click', () => {
    it('should closeMenu()', () => {
      let props = {closeMenu: jasmine.createSpy('closeMenu')};
      render(props);

      component.find('div').simulate('click');
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
        let props = {type: 'ViewerDefaultMenu', open: true};
        render(props);

        expect(component.find(ViewerDefaultMenu).length).toBe(1);
        expect(component.find(ViewerDefaultMenu).props().active).toBe(true);
      });
    });
    describe('when type is ViewerTextSelectedMenu', () => {
      it('should render this menu', () => {
        let props = {type: 'ViewerTextSelectedMenu', open: false};
        render(props);

        expect(component.find(ViewerTextSelectedMenu).length).toBe(1);
        expect(component.find(ViewerTextSelectedMenu).props().active).toBe(false);
      });
    });
    describe('when type is ViewerSaveReferenceMenu', () => {
      it('should render this menu', () => {
        let props = {type: 'ViewerSaveReferenceMenu'};
        render(props);

        expect(component.find(ViewerSaveReferenceMenu).length).toBe(1);
      });
    });
    describe('when type is ViewerSaveTargetReferenceMenu', () => {
      it('should render this menu', () => {
        let props = {type: 'ViewerSaveTargetReferenceMenu'};
        render(props);

        expect(component.find(ViewerSaveTargetReferenceMenu).length).toBe(1);
      });
    });
    describe('when type is LibraryMenu', () => {
      it('should render this menu', () => {
        let props = {type: 'LibraryMenu', open: true};
        render(props);

        expect(component.find(LibraryMenu).length).toBe(1);
      });
    });
    describe('when type is UploadsMenu', () => {
      it('should render this menu', () => {
        let props = {type: 'UploadsMenu', open: true};
        render(props);

        expect(component.find(UploadsMenu).length).toBe(1);
        expect(component.find(UploadsMenu).props().active).toBe(true);
      });
    });
  });
});
