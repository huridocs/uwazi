import React from 'react';
import { shallow } from 'enzyme';
import { LocalForm } from 'react-redux-form';
import ActivitylogForm from '../ActivitylogForm.js';

describe('ActivitylogForm', () => {
  let props;
  let component;
  let submit;
  let request;

  beforeEach(() => {
    request = Promise.resolve('ok');
    submit = jasmine.createSpy('submit').and.returnValue(request);
  });

  const render = () => {
    props = {
      submit
    };
    component = shallow(<ActivitylogForm.WrappedComponent {...props}/>);
  };

  it('should render a form', () => {
    render();
    expect(component).toMatchSnapshot();
  });

  it('should submit the values', () => {
    render();
    component.find(LocalForm).simulate('submit', { limit: 100 });
    expect(props.submit).toHaveBeenCalledWith({ limit: 100 });
  });
});
