import React from 'react';
import { shallow } from 'enzyme';
import { ErrorFallback } from 'app/App/ErrorHandling/ErrorFallback';

describe('ErrorFallback', () => {
  it('should show the error message when it is passed', () => {
    const props = { error: { name: 'error name', message: 'error details' } };
    const component = shallow(<ErrorFallback {...props} />);
    expect(component.text()).toEqual('error nameerror details');
  });

  it('should show a generic message is message is not passed', () => {
    const props = { error: { name: '', message: '' } };
    const component = shallow(<ErrorFallback {...props} />);
    expect(component.text()).toEqual('Something went wrong');
  });
});
