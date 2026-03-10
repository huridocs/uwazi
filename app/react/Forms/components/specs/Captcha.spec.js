import React from 'react';
import { shallow } from 'enzyme';
import api from '../../../utils/api';
import Captcha from '../Captcha';

describe('Captcha', () => {
  let component;
  let props;
  let onChange;

  beforeEach(() => {
    onChange = jest.fn();
    props = {
      onChange,
    };
  });

  const render = () => {
    component = shallow(<Captcha {...props} />);
  };

  describe('onChange()', () => {
    it('should return the user introduced text with the captcha id', async () => {
      spyOn(api, 'get').and.callFake(async () => Promise.resolve({ json: { svg: '', id: 2 } }));
      render();
      component.setState({ id: '2df23daskj12' });
      component.setProps({ value: { text: 'ab132' } });
      component.find('input').simulate('change', { target: { value: 'ab1324' } });
      expect(onChange).toHaveBeenLastCalledWith({ id: '2df23daskj12', text: 'ab1324' });
    });
  });

  describe('refresh()', () => {
    it('should return the refresh captcha method', async () => {
      let refreshCaptcha;
      spyOn(api, 'get').and.callFake(async () => Promise.resolve({ json: { svg: '', id: 2 } }));

      props.refresh = _refreshCaptcha => {
        refreshCaptcha = _refreshCaptcha;
      };
      render();
      expect(component.find('div div').props().dangerouslySetInnerHTML).toEqual({ __html: '' });

      api.get.and.callFake(async () => Promise.resolve({ json: { svg: 'captchasvg', id: 2 } }));
      await refreshCaptcha();
      expect(component.find('div div').props().dangerouslySetInnerHTML).toEqual({
        __html: 'captchasvg',
      });
    });
    it('should render an error when the remote captcha server is unreachable', async () => {
      spyOn(api, 'get').and.throwError();

      props.remote = true;

      render();
      const message = component.find('.alert-danger').at(0);
      expect(message).toBeDefined();
    });
  });
});
