import React from 'react';
import {shallow} from 'enzyme';
import {fromJS as Immutable} from 'immutable';
import {Field, Form, actions as formActions} from 'react-redux-form';

import {SearchBar, mapStateToProps} from '../SearchBar';

describe('SearchBar (Entities)', () => {
  let component;
  let instance;
  let props;

  beforeEach(() => {
    jasmine.clock().install();
    spyOn(formActions, 'change');

    props = {
      entityId: 'id1',
      search: {},
      searchReferences: jasmine.createSpy('searchReferences'),
      change: formActions.change
    };
  });

  afterEach(() => {
    jasmine.clock().uninstall();
  });

  let render = () => {
    component = shallow(<SearchBar {...props} />);
    instance = component.instance();
  };

  it('should render a form with the input linked to the state values, which searches references on change (debounced)', () => {
    render();

    expect(component.find(Form).props().model).toBe('entityView/search');
    expect(component.find(Form).props().onSubmit).toBe(props.searchReferences);

    expect(component.find(Field).props().model).toBe('entityView/search.searchTerm');
    expect(component.find('input').props().value).toBe('');

    component.find('input').simulate('change');
    expect(props.searchReferences).not.toHaveBeenCalled();
    jasmine.clock().tick(401);
    expect(props.searchReferences).toHaveBeenCalled();
  });

  it('should render an "X" to reset the search', () => {
    render();

    component.find('.fa.fa-close').simulate('click');
    expect(formActions.change).toHaveBeenCalledWith('entityView/search.searchTerm', '');
    expect(props.searchReferences).toHaveBeenCalled();
  });

  describe('componentWillReceiveProps', () => {
    beforeEach(() => {
      render();
    });

    it('should reset search term when changing the entity', () => {
      instance.componentWillReceiveProps({entityId: 'id1'});
      expect(props.searchReferences).not.toHaveBeenCalled();
      instance.componentWillReceiveProps({entityId: 'id2'});
      expect(formActions.change).toHaveBeenCalledWith('entityView/search.searchTerm', '');
    });
  });

  describe('componentWillUnmount', () => {
    beforeEach(() => {
      render();
    });

    it('should reset search term', () => {
      instance.componentWillUnmount();
      expect(formActions.change).toHaveBeenCalledWith('entityView/search.searchTerm', '');
    });
  });

  describe('mapStateToProps', () => {
    it('should map entityId and search from entityView', () => {
      const state = {entityView: {entity: Immutable({sharedId: 'sid'}), search: 'search'}};
      expect(mapStateToProps(state).entityId).toBe('sid');
      expect(mapStateToProps(state).search).toBe('search');
    });
  });
});
