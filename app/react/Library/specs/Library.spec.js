/**
 * @jest-environment jsdom
 */
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { LibraryRootComponent } from '#app/Library/Library.js';
import { RouteHandler } from '#app/App/RouteHandler.js';
import { create as createStore } from '#app/store.js';

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

jest.mock('#app/appRoutes', () => ({
  getAppRoutes: () => routes,
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
  let instance;
  let root;
  let currentProps;
  const props = { location: { search: { q: '(a:1)' } } };
  let dispatchCallsOrder = [];
  let context;

  const renderLibrary = nextProps => {
    currentProps = nextProps;
    const el = document.createElement('div');
    document.body.appendChild(el);
    root = createRoot(el);
    act(() => {
      root.render(
        <Provider store={context.store}>
          <LibraryRootComponent ref={ref => (instance = ref)} {...nextProps} />
        </Provider>
      );
    });
  };

  const setProps = nextProps => {
    currentProps = { ...currentProps, ...nextProps };
    act(() => {
      root.render(
        <Provider store={context.store}>
          <LibraryRootComponent ref={ref => (instance = ref)} {...currentProps} />
        </Provider>
      );
    });
  };

  beforeEach(() => {
    RouteHandler.renderedFromServer = true;
    dispatchCallsOrder = [];
    context = {
      store: {
        getState: () => ({}),
        dispatch: jasmine.createSpy('dispatch').and.callFake(action => {
          dispatchCallsOrder.push(action.type);
        }),
        subscribe: () => () => {},
      },
    };

    renderLibrary(props);
  });

  afterEach(() => {
    if (root) {
      act(() => {
        root.unmount();
      });
      root = undefined;
    }
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
      setProps(nextProps);
      expect(instance.getClientState).toHaveBeenCalled();
    });

    it('should not request the new state when the url hasnt change', () => {
      spyOn(instance, 'getClientState');
      const nextProps = { location: { search: { q: '(a:1)' } } };
      setProps(nextProps);
      expect(instance.getClientState).not.toHaveBeenCalled();
    });
  });

  describe('cleanup', () => {
    beforeEach(() => {
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
    ])(
      'should %s call emptyState when unmounting and route is %s',
      async (pathname, shouldCall) => {
        Object.defineProperty(window, 'location', {
          writable: true,
          value: { pathname },
        });

        const { emptyState } = instance;
        act(() => {
          root.unmount();
        });
        root = undefined;
        await new Promise(resolve => {
          setTimeout(resolve, 0);
        });
        if (shouldCall) {
          expect(emptyState).toHaveBeenCalled();
        } else {
          expect(emptyState).not.toHaveBeenCalled();
        }
      }
    );
  });
});
