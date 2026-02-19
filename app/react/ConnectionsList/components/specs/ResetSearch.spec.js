import React from 'react';
import { shallow } from 'enzyme';
import Immutable from 'immutable';
import { ResetSearchView as ResetSearch } from '../ResetSearch.js';

describe('ResetSearch', () => {
  let component;
  let props;

  beforeEach(() => {
    props = {
      connectionsGroups: Immutable.fromJS([]),
      resetSearch: jasmine.createSpy('resetSearch'),
    };
  });

  const render = () => {
    component = shallow(<ResetSearch {...props} />);
  };

  it('should hold a button that resets the search', () => {
    render();
    expect(props.resetSearch).not.toHaveBeenCalled();
    component.find('button').simulate('click');
    expect(props.resetSearch).toHaveBeenCalled();
  });
});
