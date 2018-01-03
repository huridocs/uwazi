import React from 'react';
import {shallow} from 'enzyme';
import {fromJS as Immutable} from 'immutable';
import Loader from 'app/components/Elements/Loader';

import {SearchResults} from '../SearchResults';

describe('SearchResults', () => {
  let component;
  let props;

  beforeEach(() => {
    props = {
      results: Immutable([{sharedId: 'r1'}, {sharedId: 'r2'}]),
      onClick: jasmine.createSpy('onClick'),
      selected: 'r2',
      searching: false
    };
  });

  function render() {
    component = shallow(<SearchResults {...props} />);
  }

  it('should render the results with onClick for each item', () => {
    render();
    expect(component.find('.item').length).toBe(2);
    expect(component.find(Loader).length).toBe(0);

    component.find('.item').at(0).simulate('click');
    expect(props.onClick).toHaveBeenCalledWith('r1', {sharedId: 'r1'});

    component.find('.item').at(1).simulate('click');
    expect(props.onClick).toHaveBeenCalledWith('r2', {sharedId: 'r2'});
  });

  it('should mark the selected item', () => {
    render();
    expect(component.find('.item').at(0).props().className).not.toContain('is-selected');
    expect(component.find('.item').at(1).props().className).toContain('is-selected');
  });

  it('should add the loader when searching for results', () => {
    props.searching = true;
    render();
    expect(component.find(Loader).length).toBe(1);
  });
});
