import React from 'react';
import { shallow } from 'enzyme';

import Icon, { mapStateToProps } from '../Icon';

describe('Icon', () => {
  let component;
  let props;

  const render = () => {
    component = shallow(<Icon.WrappedComponent {...props} />);
  };

  it('should instantiate a FontAwesomeIcon', () => {
    props = { icon: 'angle-right', size: 'xs' };
    render();
    expect(component).toMatchSnapshot();
  });

  it('should allow configuring the icon as directionAware', () => {
    props = { icon: 'angle-left', directionAware: true, locale: 'es' };
    render();
    expect(component).toMatchSnapshot();

    props = { icon: 'angle-left', directionAware: true, locale: 'ar' };
    render();
    expect(component).toMatchSnapshot();
  });

  describe('MapStateToProps', () => {
    it('should map the locale', () => {
      const state = { locale: 'en' };

      const mappedProps = mapStateToProps(state);
      expect(mappedProps.locale).toBe(state.locale);
    });
  });
});
