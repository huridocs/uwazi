import React from 'react';
import { shallow } from 'enzyme';
import { NavLink } from 'react-router-dom';

import { I18NLink, mapStateToProps } from '../I18NLink';

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => () => {},
}));

describe('I18NLink', () => {
  let component;
  let props;
  const clickAction = () => {};
  const mouseOverAction = () => {};
  const event = jasmine.createSpyObj(['preventDefault']);

  beforeEach(() => {
    props = {
      locale: 'es',
      to: '/templates',
      activeClass: 'is-active',
      onClick: clickAction,
      onMouseOver: mouseOverAction,
      dispatch: () => {},
    };
  });

  const render = () => {
    component = shallow(<I18NLink {...props} />);
  };

  describe('render', () => {
    it('should pass other props, except for dispatch', () => {
      spyOn(props, 'onClick');
      render();
      const link = component.find(NavLink);
      expect(link.props().onMouseOver).toBe(mouseOverAction);
      expect(link.props().dispatch).toBeUndefined();
      component.simulate('click', event);
      expect(props.onClick).toHaveBeenCalledWith(event);
      expect(link.props().to).toBe(props.to);
    });
  });

  describe('when its disabled', () => {
    it('should do nothing when clicked', () => {
      I18NLink.navigate = jasmine.createSpy('navigate');
      spyOn(props, 'onClick');
      props.disabled = true;
      render();
      component.simulate('click', event);
      expect(props.onClick).not.toHaveBeenCalled();
      expect(event.preventDefault).toHaveBeenCalled();
      expect(I18NLink.navigate).not.toHaveBeenCalled();
    });
  });

  describe('mapStateToProps', () => {
    it('should append the locale to the "to" url', () => {
      expect(mapStateToProps({ locale: 'es' }, props).to).toBe('/es/templates');
    });

    describe('when there is no locale', () => {
      it('should pass the "to" url unchanged', () => {
        expect(mapStateToProps({}, props).to).toBe('/templates');
      });
    });
  });
});
