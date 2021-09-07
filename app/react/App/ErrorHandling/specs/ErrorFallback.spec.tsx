import React from 'react';
import { shallow } from 'enzyme';
import { ErrorFallback } from 'app/App/ErrorHandling/ErrorFallback';

describe('ErrorFallback', () => {
  it('should show the error message when it is passed', () => {
    const props = { error: { name: 'error name', message: 'error details' } };
    const component = shallow(<ErrorFallback {...props} />);
    const errorName = component.find('.error-message-lg').at(0);
    expect(errorName.text()).toEqual('error name');
    const errorDetails = component.find('.error-details').at(0);
    expect(errorDetails.text()).toEqual('error details');
  });

  it('should show additional error info if code is 500', () => {
    const props = { error: { name: '', message: '', code: '500', requestId: '1234' } };
    const component = shallow(<ErrorFallback {...props} />);
    const requestId = component.find('.error-message-sm').at(0);
    expect(requestId.text()).toContain('1234');
    const code = component.find('.error-code').at(0);
    expect(code.text()).toEqual('500');
  });

  it('should not show requestId is code is different than 500', () => {
    const props = { error: { name: '', message: '', code: '400', requestId: '1234' } };
    const component = shallow(<ErrorFallback {...props} />);
    const requestId = component.find('.error-message-sm');
    expect(requestId.length).toBe(0);
    const code = component.find('.error-code').at(0);
    expect(code.text()).toEqual('400');
  });

  it('should show a generic message is message is not passed', () => {
    const props = { error: { name: '', message: '' } };
    const component = shallow(<ErrorFallback {...props} />);
    const errorName = component.find('.error-message-lg').at(0);
    expect(errorName.children().props().children).toEqual('Something went wrong');
  });
});
