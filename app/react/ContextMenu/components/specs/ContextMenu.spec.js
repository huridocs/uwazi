import React, { Component } from 'react';
import { shallow } from 'enzyme';
import { connect } from 'react-redux';

import { ContextMenu } from 'app/ContextMenu/components/ContextMenu';

const SubMenu = () => <div />;

class SubMenu2 extends Component {
  render() {
    return <div />;
  }
}

const SubMenu2Container = connect()(SubMenu2);

describe('ContextMenu', () => {
  let component;

  const render = (withProps = {}) => {
    component = shallow(
      <ContextMenu {...withProps}>
        <SubMenu />
        <SubMenu2Container />
      </ContextMenu>
    );
  };

  describe('on mouseEnter', () => {
    it('should openMenu()', () => {
      const props = { openMenu: jasmine.createSpy('openMenu') };
      render(props);

      component.find('div').simulate('mouseenter');
      expect(props.openMenu).toHaveBeenCalled();
    });
  });

  describe('on mouseleave', () => {
    it('should closeMenu()', () => {
      const props = { closeMenu: jasmine.createSpy('closeMenu') };
      render(props);

      component.find('div').simulate('mouseleave');
      expect(props.closeMenu).toHaveBeenCalled();
    });
  });

  describe('on click', () => {
    it('should closeMenu()', () => {
      const props = { closeMenu: jasmine.createSpy('closeMenu') };
      render(props);

      component.find('div').simulate('click');
      expect(props.closeMenu).toHaveBeenCalled();
    });
  });

  describe('Menu rendered', () => {
    describe('when type is null', () => {
      it('should not render any menu', () => {
        const props = { type: null };
        render(props);

        expect(component.find('div').children().length).toBe(0);
      });
    });

    describe('when type is SubMenu and is open', () => {
      it('should render this menu with active true', () => {
        const props = { type: 'SubMenu', open: true };
        render(props);

        expect(component.find(SubMenu).length).toBe(1);
        expect(component.find(SubMenu).props().active).toBe(true);
      });
    });

    describe('when type is SubMenu2', () => {
      it('should render SubMenu2Container', () => {
        const props = { type: 'SubMenu2', open: false };
        render(props);

        expect(component.find(SubMenu2Container).length).toBe(1);
        expect(component.find(SubMenu2Container).props().active).toBe(false);
      });
    });
  });
});
