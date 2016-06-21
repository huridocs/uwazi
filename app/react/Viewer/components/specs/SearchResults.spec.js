import React from 'react';
import Immutable from 'immutable';
import {shallow} from 'enzyme';

import SearchResults from 'app/Viewer/components/SearchResults';

describe('SearchResults', () => {
  let component;
  let props;
  let results;

  beforeEach(() => {
    props = {
      results: Immutable.fromJS([{title: 'result1', _id: 'id1'}, {title: 'result2', _id: 'id2'}]),
      onClick: jasmine.createSpy('onClick')
    };
  });

  let render = () => {
    component = shallow(<SearchResults {...props}/>);
    results = component.find('.item-info');
  };

  it('should render a list with all the results', () => {
    render();
    expect(results.first().text()).toBe('result1');
    expect(results.last().text()).toBe('result2');
  });

  describe('onClick', () => {
    it('should execute props.onClick passing the id', () => {
      render();
      component.find('.item').last().simulate('click');
      expect(props.onClick).toHaveBeenCalledWith('id2');
    });
  });

  describe('when searching', () => {
    it('should show a loader instead of the results', () => {
      props.searching = true;
      render();
      expect(results.length).toBe(0);
      expect(component.find('.loader').length).toBe(1);
    });
  });

  describe('when selected', () => {
    it('should add is-selected class to the selected item', () => {
      props.selected = 'id1';
      render();

      expect(component.find('.item').first().hasClass('is-selected')).toBe(true);
    });
  });
});
