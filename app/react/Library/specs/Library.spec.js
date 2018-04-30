import React from 'react';

import { shallow } from 'enzyme';
import Library from 'app/Library/Library';
import RouteHandler from 'app/App/RouteHandler';
import createStore from 'app/store';
import DocumentsList from 'app/Library/components/DocumentsList';

describe('Library', () => {
  const templates = [
    { name: 'Decision', _id: 'abc1', properties: [{ name: 'p', filter: true, type: 'text', prioritySorting: true }] },
    { name: 'Ruling', _id: 'abc2', properties: [] }
  ];
  const thesauris = [{ name: 'countries', _id: '1', values: [] }];
  createStore({ templates, thesauris });
  let component;
  let instance;
  let context;
  const props = { location: { query: { q: '(a:1)' } } };
  let dispatchCallsOrder = [];

  beforeEach(() => {
    RouteHandler.renderedFromServer = true;
    dispatchCallsOrder = [];
    context = { store: { dispatch: jasmine.createSpy('dispatch').and.callFake((action) => {
      dispatchCallsOrder.push(action.type);
    }) } };
    component = shallow(<Library {...props}/>, { context });
    instance = component.instance();
  });

  it('should render the DocumentsList (by default)', () => {
    expect(component.find(DocumentsList).length).toBe(1);
    expect(component.find(DocumentsList).props().storeKey).toBe('library');
  });

  describe('componentWillReceiveProps()', () => {
    beforeEach(() => {
      instance.superComponentWillReceiveProps = jasmine.createSpy('superComponentWillReceiveProps');
    });

    it('should update if "q" has changed', () => {
      const nextProps = { location: { query: { q: '(a:2)' } } };
      instance.componentWillReceiveProps(nextProps);
      expect(instance.superComponentWillReceiveProps).toHaveBeenCalledWith(nextProps);
    });

    it('should not update if "q" is the same', () => {
      const nextProps = { location: { query: { q: '(a:1)' } } };
      instance.componentWillReceiveProps(nextProps);
      expect(instance.superComponentWillReceiveProps).not.toHaveBeenCalled();
    });
  });
});
