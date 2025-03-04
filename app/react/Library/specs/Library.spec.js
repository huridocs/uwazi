/**
 * @jest-environment jsdom
 */
import React from 'react';
import { shallow } from 'enzyme';
import { LibraryRootComponent } from 'app/Library/Library';
import RouteHandler from 'app/App/RouteHandler';
import createStore from 'app/store';

const routes = [
  {
    path: '/',
    children: [
      {
        children: [
          { index: true },
          { path: 'login' },
          {
            path: 'library/*',
            children: [
              { index: true, handle: { library: true } },
              { path: 'map', handle: { library: true } },
              { path: 'table', handle: { library: true } },
            ],
          },
        ],
      },
      {
        path: 'en',
        children: [
          {
            children: [
              { index: true },
              { path: 'login' },
              {
                path: 'library/*',
                children: [
                  { index: true, handle: { library: true } },
                  { path: 'map', handle: { library: true } },
                  { path: 'table', handle: { library: true } },
                ],
              },
            ],
          },
          { path: '*' },
        ],
        handle: { library: true },
      },
    ],
    handle: { library: true },
  },
];

jest.mock('app/appRoutes', () => ({
  routes,
}));

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
  const props = { location: { search: { q: '(a:1)' } } };
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

    component = shallow(<LibraryRootComponent {...props} />, { context });
    instance = component.instance();
  });

  describe('urlHasChanged', () => {
    it('return true when q has changed', () => {
      const nextProps = { location: { search: { q: '(a:2)' } } };
      expect(instance.urlHasChanged(nextProps)).toBe(true);
    });

    it('should not update if "q" is the same', () => {
      const nextProps = { location: { search: { q: '(a:1)' } } };
      expect(instance.urlHasChanged(nextProps)).toBe(false);
    });
  });

  describe('component update', () => {
    it('should request the new state when the url changes', () => {
      spyOn(instance, 'getClientState');
      const nextProps = { location: { search: { q: '(a:2)' } } };
      component.setProps(nextProps);
      expect(instance.getClientState).toHaveBeenCalled();
    });

    it('should not request the new state when the url hasnt change', () => {
      spyOn(instance, 'getClientState');
      const nextProps = { location: { search: { q: '(a:1)' } } };
      component.setProps(nextProps);
      expect(instance.getClientState).not.toHaveBeenCalled();
    });
  });

  describe('cleanup', () => {
    beforeEach(() => {
      component = shallow(<LibraryRootComponent {...props} />, { context });
      instance = component.instance();
      spyOn(instance, 'emptyState');
    });

    it.each([
      ['/library/some-path', false],
      ['/library/map', false],
      ['/library/table', false],
      ['/en/library/some-path', false],
      ['/en/library/map', false],
      ['/en/library/table', false],
      ['/', false],
      ['/en', false],
      ['/some-path', true],
      ['/no-match', true],
    ])('should %s call emptyState when unmounting and route is %s', (pathname, shouldCall) => {
      Object.defineProperty(window, 'location', {
        writable: true,
        value: { pathname },
      });

      component.unmount();
      if (shouldCall) {
        expect(instance.emptyState).toHaveBeenCalled();
      } else {
        expect(instance.emptyState).not.toHaveBeenCalled();
      }
    });
  });
});
