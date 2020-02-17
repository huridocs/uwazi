import React from 'react';
import { shallow } from 'enzyme';

import Captcha from '../Captcha';

describe('Captcha', () => {
  let component;
  let props;

  beforeEach(() => {
    props = {
      onChange: () => {},
    };
  });

  const render = () => {
    component = shallow(<Captcha {...props} />);
  };

  it('should render a Captcha image with an input', () => {
    render();
    expect(component).toMatchSnapshot();
  });

  describe('refresh()', () => {
    it('should return the refresh captcha method', done => {
      let refreshCaptcha;
      props.refresh = _refreshCaptcha => {
        refreshCaptcha = _refreshCaptcha;
      };
      render();
      expect(component.find('img').props().src).toBe('/captcha');
      refreshCaptcha();
      component.update();
      expect(component.find('img').props().src).not.toBe('/captcha');
      done();
    });
  });
});
