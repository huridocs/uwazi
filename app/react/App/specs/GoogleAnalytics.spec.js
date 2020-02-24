/**
 * @jest-environment jsdom
 */
import React from 'react';

import { shallow } from 'enzyme';

import { GoogleAnalytics, trackPage } from '../GoogleAnalytics';

describe('GoogleAnalytics', () => {
  let component;
  let props;

  beforeEach(() => {
    props = {
      analyticsTrackingId: 'X-AAA-Y',
    };
  });

  const render = () => {
    component = shallow(<GoogleAnalytics {...props} />);
  };

  it('should define a ga method', () => {
    render();
    expect(window.gtag).toEqual(jasmine.any(Function));
  });

  it('should render a script', () => {
    render();
    expect(component.find('script').length).toBe(1);
  });

  describe('when the thracking Id is not set', () => {
    beforeEach(() => {
      props.analyticsTrackingId = '';
    });

    it('should not render', () => {
      render();
      expect(component.find('script').length).toBe(0);
    });

    it('should not define ga', () => {
      let undefinedValue;
      window.gtag = undefinedValue;
      render();
      expect(window.gtag).not.toBeDefined();
    });
  });

  describe('trackPage', () => {
    it('should send a pageview event to gtag', () => {
      window.gtag = jasmine.createSpy('gtag');
      trackPage();
      expect(window.gtag).toHaveBeenCalledWith('send', 'pageview');
    });

    describe('if gtag is not defined does nothing', () => {
      it('should do nothing', () => {
        delete window.gtag;
        expect(trackPage).not.toThrow();
      });
    });
  });
});
