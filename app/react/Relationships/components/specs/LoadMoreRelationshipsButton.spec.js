import React from 'react';
import {shallow} from 'enzyme';
import {fromJS} from 'immutable';

import {LoadMoreRelationshipsButton, mapStateToProps} from '../LoadMoreRelationshipsButton';

describe('LoadMoreRelationshipsButton', () => {
  let component;
  let props;

  beforeEach(() => {
    props = {
      totalHubs: 4,
      requestedHubs: 4,
      action: jasmine.createSpy('action'),
      loadMoreAmmount: 2
    };
  });

  let render = () => {
    component = shallow(<LoadMoreRelationshipsButton {...props} />);
  };

  it('should not render a button when all hubs loaded', () => {
    render();
    expect(component.find('button').length).toBe(0);
  });

  describe('Load More button', () => {
    beforeEach(() => {
      props.requestedHubs = 3;
      render();
    });

    it('should render a button when partial loaded hubs', () => {
      expect(component.find('button').length).toBe(1);
      expect(component.find('button').text()).toBe('2 x more');
    });

    it('should call on the passed function upon click with previously requestedHubs', () => {
      const button = component.find('button');
      button.simulate('click');
      expect(props.action).toHaveBeenCalledWith(5);
    });
  });

  describe('mapStateToProps', () => {
    it('should map the relationships list search results', () => {
      const state = {relationships: {list: {
        searchResults: fromJS({totalHubs: 'totalHubs', requestedHubs: 'requestedHubs'})
      }}};

      expect(mapStateToProps(state)).toEqual({totalHubs: 'totalHubs', requestedHubs: 'requestedHubs', loadMoreAmmount: 10});
    });
  });
});
