import React from 'react';
import { fromJS } from 'immutable';

import { shallow } from 'enzyme';

import { ViewDocButton } from '../ViewDocButton';

describe('ViewDocButton', () => {
  let props;
  let component;
  beforeEach(() => {
    props = {
      type: 'entity',
      format: 'format',
      sharedId: '123',
      searchTerm: '',
      activateReference: jest.fn()
    };
  });

  const render = () => {
    component = shallow(<ViewDocButton {...props}/>);
    return component;
  };

  it('should render a view button poiting to the doc url with the searchTerm if pressent', () => {
    render();
    expect(component).toMatchSnapshot();

    props.searchTerm = 'something';
    render();
    expect(component).toMatchSnapshot();
  });
  describe('when targetReference is provided', () => {
    it('should call activateReference when clicked', () => {
      const event = { stopPropagation: jest.fn() };
      props.targetReference = fromJS({ range: { start: 200, end: 300 } });
      render();
      component.simulate('click', event);
      expect(props.activateReference).toHaveBeenCalledWith(props.targetReference.toJS());
    });
  });
});
