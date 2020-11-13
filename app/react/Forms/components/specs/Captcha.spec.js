import React from 'react';
import { shallow } from 'enzyme';
import api from '../../../utils/api';
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
      expect(component.find('div div').props().dangerouslySetInnerHTML).toEqual({ __html: '' });
      spyOn(api, 'get').and.returnValue(Promise.resolve({ captcha: 'captchasvg', id: 2 }));
      refreshCaptcha();
      component.update();
      expect(component.find('div div').props().src).not.toBe('/api/captcha');
      done();
    });
  });
});
