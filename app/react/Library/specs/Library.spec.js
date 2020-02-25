import React from 'react';
import { shallow } from 'enzyme';
import Library from 'app/Library/Library';
import RouteHandler from 'app/App/RouteHandler';
import createStore from 'app/store';
import DocumentsList from 'app/Library/components/DocumentsList';
import LibraryModeToggleButtons from 'app/Library/components/LibraryModeToggleButtons';

describe('Library', () => {
  const templates = [
    {
      name: 'Decision',
      _id: 'abc1',
      properties: [{ name: 'p', filter: true, type: 'text', prioritySorting: true }],
    },
    { name: 'Ruling', _id: 'abc2', properties: [] },
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
    context = {
      store: {
        getState: () => ({}),
        dispatch: jasmine.createSpy('dispatch').and.callFake(action => {
          dispatchCallsOrder.push(action.type);
        }),
      },
    };

    component = shallow(<Library {...props} />, { context });
    instance = component.instance();
  });

  it('should render the DocumentsList (by default)', () => {
    expect(component.find(DocumentsList).length).toBe(1);
    expect(component.find(DocumentsList).props().storeKey).toBe('library');
  });

  it('should include the Toggle Buttons with zoom in and out functionality', () => {
    const libraryButtons = component.find(LibraryModeToggleButtons);
    expect(dispatchCallsOrder).toEqual(['ENTER_LIBRARY']);
    libraryButtons.props().zoomIn();
    expect(dispatchCallsOrder).toEqual(['ENTER_LIBRARY', 'ZOOM_IN']);
    libraryButtons.props().zoomOut();
    expect(dispatchCallsOrder).toEqual(['ENTER_LIBRARY', 'ZOOM_IN', 'ZOOM_OUT']);
  });

  describe('urlHasChanged', () => {
    it('return true when q has changed', () => {
      const nextProps = { location: { query: { q: '(a:2)' } } };
      expect(instance.urlHasChanged(nextProps)).toBe(true);
    });

    it('should not update if "q" is the same', () => {
      const nextProps = { location: { query: { q: '(a:1)' } } };
      expect(instance.urlHasChanged(nextProps)).toBe(false);
    });
  });
});
