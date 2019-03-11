import React from 'react';
import { shallow } from 'enzyme';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import DirectionAwareIcon, { mapStateToProps } from '../DirectionAwareIcon';


describe('DirectionAwareIcon (LTR and RTL support)', () => {
  let component;
  let props;

  const render = () => {
    component = shallow(<DirectionAwareIcon.WrappedComponent {...props} />);
  };

  const checkValues = (componentProps, sentProps) => {
    Object.keys(sentProps).forEach((prop) => {
      expect(componentProps[prop]).toBe(sentProps[prop]);
    });
  };

  it('should pass properties and keep the original icon if language not RTL', () => {
    render();
    expect(component.find(FontAwesomeIcon).props().flip).toBe(null);

    props = { locale: 'es', icon: 'angle-right', size: 'xs', arbitrary: true };
    const { locale, ...expectedPassedProps } = props;
    render();

    const IconComponentProps = component.find(FontAwesomeIcon).props();

    expect(IconComponentProps.flip).toBe(null);
    expect(IconComponentProps.locale).not.toBeDefined();
    checkValues(IconComponentProps, expectedPassedProps);
  });

  it('should flip the icon if language RTL', () => {
    props = { locale: 'ar', icon: 'angle-right' };
    render();
    expect(component.find(FontAwesomeIcon).props().flip).toBe('horizontal');
    expect(component.find(FontAwesomeIcon).props().icon).toBe('angle-right');
  });

  describe('MapStateToProps', () => {
    it('should map the locale', () => {
      const state = { locale: 'en' };

      const mappedProps = mapStateToProps(state,);
      expect(mappedProps.locale).toBe(state.locale);
    });
  });
});
