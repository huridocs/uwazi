import React from 'react';
import { shallow } from 'enzyme';
import Immutable from 'immutable';
import { LocalForm } from 'react-redux-form';
import PublicForm from '../PublicForm.js';

describe('PublicForm', () => {
  let props;
  let component;
  let instance;
  let submit;
  let request;

  beforeEach(() => {
    request = Promise.resolve({ promise: Promise.resolve('ok') });
    submit = jasmine.createSpy('submit').and.returnValue(request);
  });

  const render = (customProps, generatedId = false) => {
    props = {
      template: Immutable.fromJS({
        _id: '123',
        commonProperties: [
          {
            label: 'Title changed',
            name: 'title',
            generatedId,
          },
        ],
        properties: [{ type: 'text', name: 'text' }],
      }),
      thesauris: Immutable.fromJS([]),
      file: false,
      attachments: false,
      submit,
      remote: false,
    };
    const mappedProps = { ...props, ...customProps };
    component = shallow(<PublicForm.WrappedComponent {...mappedProps} />);
    instance = component.instance();
    instance.refreshCaptcha = jasmine.createSpy('refreshCaptcha');
    instance.formDispatch = jasmine.createSpy('formDispatch');
  };

  it('should render a form', () => {
    render();
    expect(component).toMatchSnapshot();
  });

  it('should render a generated ID as title if the option is marked', () => {
    render({}, true);
    const title = component.find('#title').at(0);
    expect(title.props().defaultValue).toEqual(expect.stringMatching(/^[a-zA-Z0-9-]{12}$/));
  });

  it('should enable remote captcha', () => {
    render({ remote: true });
    expect(component).toMatchSnapshot();
  });

  it('should render a form with file and attachments', () => {
    render({ file: true, attachments: true });
    expect(component).toMatchSnapshot();
  });

  it('should submit the values wrapped', () => {
    render();
    component
      .find(LocalForm)
      .simulate('submit', { title: 'test', metadata: { color: 'red', size: 42, date: 13442423 } });
    expect(props.submit).toHaveBeenCalledWith(
      {
        file: undefined,
        metadata: { color: [{ value: 'red' }], date: [{ value: 13442423 }], size: [{ value: 42 }] },
        template: '123',
        title: 'test',
      },
      false
    );
  });

  it('should refresh the captcha and clear the form after submit', done => {
    render();
    component.find(LocalForm).simulate('submit', { title: 'test' });
    request.then(uploadCompletePromise => {
      uploadCompletePromise.promise.then(() => {
        expect(instance.formDispatch).toHaveBeenCalledWith({
          model: 'publicform',
          type: 'rrf/reset',
        });
        expect(instance.refreshCaptcha).toHaveBeenCalled();
        done();
      });
    });
  });

  it('should refresh captcha and NOT clear the form on submission error', done => {
    request = new Promise(resolve => {
      resolve({ promise: Promise.reject() });
    });
    submit = jasmine.createSpy('submit').and.returnValue(request);
    render();
    component.find(LocalForm).simulate('submit', { title: 'test' });
    request.then(uploadCompletePromise => {
      uploadCompletePromise.promise
        .then(() => fail('should throw error'))
        .catch(() => {
          expect(instance.formDispatch).not.toHaveBeenCalledWith();
          expect(instance.refreshCaptcha).toHaveBeenCalled();
          done();
        });
    });
  });
});
