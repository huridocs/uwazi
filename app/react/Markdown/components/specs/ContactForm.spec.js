/**
 * @jest-environment jsdom
 */
import React from 'react';
import { shallow } from 'enzyme';
import { act } from 'react-dom/test-utils';
import { LocalForm } from 'app/Forms/Form';
import { Captcha } from 'app/ReactReduxForms';
import api from 'app/utils/api';
import { renderConnectedMount } from 'app/utils/test/renderConnected';
import { ContactForm } from '../ContactForm.js';

describe('ContactForm', () => {
  let props;
  let instance;
  let component;
  const formValues = { name: 'test', email: 'test@test.com', message: 'test' };

  const prepareMocks = () => {
    instance = component.instance();
    instance.refreshCaptcha = jest.fn();
    instance.formDispatch = jest.fn();
    component.find(LocalForm).props().getDispatch(instance.formDispatch);
    const captcha = component.find(Captcha);
    captcha.props().refresh = instance.refreshCaptcha;
    captcha.props().refresh(instance.refreshCaptcha);
  };

  beforeEach(() => {
    spyOn(api, 'post').and.callFake(async () => Promise.resolve());
    props = { notify: () => {} };
  });

  it('should render the ContactForm', () => {
    const shallowRender = shallow(<ContactForm {...props} />);
    expect(shallowRender).toMatchSnapshot();
  });

  it('should submit the values and reset the form', async () => {
    component = renderConnectedMount(ContactForm, undefined, props, true);
    prepareMocks();

    await act(async () => {
      component
        .find(LocalForm)
        .props()
        .onSubmit({
          ...formValues,
          captcha: { id: '1', captcha: 'abcd' },
        });
    });

    expect(api.post).toHaveBeenCalledWith('contact', {
      data: {
        ...formValues,
        captcha: JSON.stringify({ id: '1', captcha: 'abcd' }),
      },
      headers: {},
    });

    expect(instance.refreshCaptcha).toHaveBeenCalled();
    expect(instance.formDispatch).toHaveBeenCalledWith({
      model: 'contactform',
      type: 'rrf/reset',
    });
  });
});
