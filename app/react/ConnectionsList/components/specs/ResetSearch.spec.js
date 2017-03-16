import React from 'react';
import {shallow} from 'enzyme';
import {fromJS as Immutable} from 'immutable';
import {ResetSearch} from '../ResetSearch';

describe('ResetSearch', () => {
  let component;
  let props;

  beforeEach(() => {
    props = {
      connectionsGroups: Immutable([]),
      resetSearch: jasmine.createSpy('resetSearch')
    };
  });

  let render = () => {
    component = shallow(<ResetSearch {...props} />);
  };

  it('should hold a button that resets the search', () => {
    render();
    expect(props.resetSearch).not.toHaveBeenCalled();
    component.find('button').simulate('click');
    expect(props.resetSearch).toHaveBeenCalled();
  });
});
