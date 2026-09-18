/**
 * @jest-environment jsdom
 */
import React, { Component } from 'react';
import { mount } from 'enzyme';

import { CustomProvider as Provider, AppProviderContext } from '../Provider.js';

describe('Provider', () => {
  let component;
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
      return <div>{this.context ? null : null}</div>;
    }
  }

  TestController.contextType = AppProviderContext;

  afterEach(() => {
    delete window.__reduxData__;
    delete window.__atomStoreData__;
  });

  describe('context', () => {
    it('should be provided to RouteHandler with getInitialData', () => {
      mount(
        <Provider initialData={initialData}>
          <TestController ref={ref => (component = ref)} />
        </Provider>
      );
      expect(component.context.getInitialData).toEqual(jasmine.any(Function));
    });

    it('should be provided to RouteHandler with getUser', () => {
      mount(
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
        mount(
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
        mount(
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
          mount(
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
          mount(
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
