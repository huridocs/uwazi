/**
 * @jest-environment jsdom
 */
import React, { Component, act } from 'react';
import { createRoot } from 'react-dom/client';

import { CustomProvider as Provider, AppProviderContext } from '../Provider.js';

describe('Provider', () => {
  let component;
  let root;
  const initialData = { data: 'some data' };
  const user = { name: 'Bane' };

  class TestController extends Component {
    constructor(props, context) {
      super(props, context);
      this.state = {};
    }

    static async requestState() {
      return Promise.resolve({ initialData: 'data' });
    }

    render() {
      return <div />;
    }
  }

  TestController.contextType = AppProviderContext;

  const render = ui => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    root = createRoot(el);
    act(() => {
      root.render(ui);
    });
  };

  afterEach(() => {
    act(() => {
      root?.unmount();
    });
    delete window.__reduxData__;
    delete window.__atomStoreData__;
  });

  describe('context', () => {
    it('should be provided to RouteHandler with getInitialData', () => {
      render(
        <Provider initialData={initialData}>
          <TestController ref={ref => (component = ref)} />
        </Provider>
      );
      expect(component.context.getInitialData).toEqual(jasmine.any(Function));
    });

    it('should be provided to RouteHandler with getUser', () => {
      render(
        <Provider initialData={initialData} user={user}>
          <TestController ref={ref => (component = ref)} />
        </Provider>
      );
      expect(component.context.getUser).toEqual(jasmine.any(Function));
    });
  });

  describe('getInitialData()', () => {
    describe('when is in props', () => {
      beforeEach(() => {
        render(
          <Provider initialData={initialData}>
            <TestController ref={ref => (component = ref)} />
          </Provider>
        );
      });

      it('should be accessible via getInitialData', () => {
        expect(component.context.getInitialData()).toEqual({ data: 'some data' });
      });
    });

    describe('when is on window', () => {
      beforeEach(() => {
        window.__reduxData__ = { data: 'some data' };
        render(
          <Provider>
            <TestController ref={ref => (component = ref)} />
          </Provider>
        );
      });

      it('should be accessible via getInitialData ONLY ONCE', () => {
        expect(component.context.getInitialData()).toEqual({ data: 'some data' });
        expect(component.context.getInitialData()).toBeUndefined();
      });
    });

    describe('getUser()', () => {
      describe('when is in props', () => {
        beforeEach(() => {
          render(
            <Provider initialData={initialData} user={user}>
              <TestController ref={ref => (component = ref)} />
            </Provider>
          );
        });

        it('should be accesible via getUser()', () => {
          expect(component.context.getUser()).toEqual({ name: 'Bane' });
        });
      });

      describe('when is in atomStoreData', () => {
        beforeEach(() => {
          window.__atomStoreData__ = { user, translations: [] };
          render(
            <Provider initialData={initialData}>
              <TestController ref={ref => (component = ref)} />
            </Provider>
          );
        });

        it('should be accesible via getUser()', () => {
          expect(component.context.getUser()).toEqual({ name: 'Bane' });
        });
      });
    });
  });
});
