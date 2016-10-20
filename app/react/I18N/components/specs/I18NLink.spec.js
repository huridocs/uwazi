import React from 'react';
import {shallow} from 'enzyme';
import {Link} from 'react-router';

import {I18NLink} from '../I18NLink';

describe('I18NLink', () => {
  let component;
  let props;
  let clickAction = () => {};

  beforeEach(() => {
    props = {
      locale: 'es',
      to: '/templates',
      activeClass: 'is-active',
      onClick: clickAction
    };
  });

  let render = () => {
    component = shallow(<I18NLink {...props} />);
  };

  describe('render', () => {
    it('should render a Link appending the locale to the url', () => {
      render();
      let link = component.find(Link);
      expect(link.props().to).toBe('/es/templates');
    });

    describe('when there is no locale', () => {
      it('should render a Link with the url', () => {
        delete props.locale;
        render();
        let link = component.find(Link);
        expect(link.props().to).toBe('/templates');
      });
    });

    it('should pass other props', () => {
      render();
      let link = component.find(Link);
      expect(link.props().activeClass).toBe('is-active');
      expect(link.props().onClick).toBe(clickAction);
    });
  });
});
