import React from 'react';

import { shallow } from 'enzyme';

import { ViewDocButton } from '../ViewDocButton';

describe('ViewDocButton', () => {
  it('should render a view button poiting to the doc url with the searchTerm if pressent', () => {
    const props = {
      type: 'entity',
      format: 'format',
      sharedId: '123',
      searchTerm: ''
    };

    let component = shallow(<ViewDocButton {...props}/>);
    expect(component).toMatchSnapshot();

    props.searchTerm = 'something';
    component = shallow(<ViewDocButton {...props}/>);
    expect(component).toMatchSnapshot();
  });
});
