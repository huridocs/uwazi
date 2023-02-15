import React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';
import { WebMediaResourceForm } from '../WebMediaResourceForm';

let component: ShallowWrapper;

const submitSpy = jest.fn();

const render = (name: boolean) => {
  component = shallow(<WebMediaResourceForm handleSubmit={submitSpy} hasName={name} />);
};

it('Should match render of wem media form', () => {
  render(false);
  expect(component).toMatchSnapshot();
});

it('should also display a name field when hasName is true', () => {
  render(true);
  expect(component).toMatchSnapshot();
});

it('should call the handleSubmit function on submit', () => {
  render(true);
  component.find('LocalForm').simulate('submit');
  expect(submitSpy).toHaveBeenCalled();
});
