import React from 'react';
import {shallow} from 'enzyme';
import {Link} from 'react-router';

import {I18NLink, mapStateToProps} from '../I18NLink';

describe('I18NLink', () => {
  let component;
  let props;
  let clickAction = () => {};
  let mouseOverAction = () => {};

  beforeEach(() => {
    props = {
      locale: 'es',
      to: '/templates',
      activeClass: 'is-active',
      onClick: clickAction,
      onMouseOver: mouseOverAction,
      dispatch: () => {}
    };
  });

  let render = () => {
    component = shallow(<I18NLink {...props} />);
  };

  describe('render', () => {
    it('should pass other props, except for dispatch', () => {
      render();
      let link = component.find(Link);
      expect(link.props().onClick).toBe(clickAction);
      expect(link.props().onMouseOver).toBe(mouseOverAction);
      expect(link.props().dispatch).toBeUndefined();
    });
  });

  describe('mapStateToProps', () => {
    it('should append the locale to the "to" url', () => {
      expect(mapStateToProps({locale: 'es'}, props).to).toBe('/es/templates');
    });

    describe('when there is no locale', () => {
      it('should pass the "to" url unchanged', () => {
        expect(mapStateToProps({}, props).to).toBe('/templates');
      });
    });
  });
});
