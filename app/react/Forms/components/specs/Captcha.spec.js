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

  describe('refresh()', () => {
    it('should return the refresh captcha method', async () => {
      let refreshCaptcha;
      props.refresh = _refreshCaptcha => {
        refreshCaptcha = _refreshCaptcha;
      };
      render();
      expect(component.find('div div').props().dangerouslySetInnerHTML).toEqual({ __html: '' });
      spyOn(api, 'get').and.returnValue(Promise.resolve({ json: { svg: 'captchasvg', id: 2 } }));
      await refreshCaptcha();

      expect(component.find('div div').props().dangerouslySetInnerHTML).toEqual({
        __html: 'captchasvg',
      });
    });
  });
});
