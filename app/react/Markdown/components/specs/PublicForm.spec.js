import React from 'react';
import { shallow } from 'enzyme';
import Immutable from 'immutable';
import * as uploadsActions from 'app/Uploads/actions/uploadsActions';
import { LocalForm } from 'react-redux-form';
import PublicForm, { mapDispatchToProps } from '../PublicForm.js';

describe('PublicForm', () => {
  let props;
  let component;
  let instance;
  const dispatch = () => {};

  beforeEach(() => {
    spyOn(uploadsActions, 'publicSubmit');
  });

  const render = (customProps) => {
    props = {
      template: Immutable.fromJS({ properties: [{ type: 'text', name: 'text' }] }),
      thesauris: Immutable.fromJS([]),
      file: false,
      attachments: false,
    };
    const mappedProps = { ...props, ...customProps, ...mapDispatchToProps(dispatch) };
    component = shallow(<PublicForm.WrappedComponent {...mappedProps}/>);
    instance = component.instance();
    instance.refreshCaptcha = jasmine.createSpy('refreshCaptcha');
    instance.formDispatch = jasmine.createSpy('formDispatch');
  };

  it('should render a form', () => {
    render();
    expect(component).toMatchSnapshot();
  });

  it('should render a form with file and attachments', () => {
    render({ file: true, attachments: true });
    expect(component).toMatchSnapshot();
  });

  it('should submit the values', () => {
    render();
    component.find(LocalForm).simulate('submit', { title: 'test' });
    expect(uploadsActions.publicSubmit).toHaveBeenCalledWith({ file: undefined, title: 'test' });
  });

  it('should refresh the captcha and clear the form after submit', () => {
    render();
    component.find(LocalForm).simulate('submit', { title: 'test' });
    expect(instance.refreshCaptcha).toHaveBeenCalled();
    expect(instance.formDispatch).toHaveBeenCalledWith({ model: 'publicform', type: 'rrf/reset' });
  });
});
