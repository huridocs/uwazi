import PropTypes from 'prop-types';
import React, { Component } from 'react';
import TestUtils from 'react-addons-test-utils';
import Provider from '../Provider';

describe('Provider', () => {
  let component;
  let initialData = {data: 'some data'};
  let user = {name: 'Bane'};

  class TestController extends Component {

    constructor(props, context) {
      super(props, context);
      this.state = {};
      this.context = context;
    }

    static requestState() {
      return Promise.resolve({initialData: 'data'});
    }

    render() {
      return <div/>;
    }
  }

  TestController.contextTypes = {getInitialData: PropTypes.func, getUser: PropTypes.func};

  afterEach(() => {
    delete window.__initialData__;
    delete window.__user__;
  });

  describe('context', () => {
    it('should be provided to RouteHandler with getInitialData', () => {
      TestUtils.renderIntoDocument(
        <Provider initialData={initialData} >
        <TestController ref={(ref) => component = ref} />
        </Provider>
      );
      expect(component.context.getInitialData).toEqual(jasmine.any(Function));
    });

    it('should be provided to RouteHandler with getUser', () => {
      TestUtils.renderIntoDocument(
        <Provider initialData={initialData} user={user} >
          <TestController ref={(ref) => component = ref} />
        </Provider>
      );
      expect(component.context.getUser).toEqual(jasmine.any(Function));
    });
  });

  describe('getInitialData()', () => {
    describe('when is in props', () => {
      beforeEach(() => {
        TestUtils.renderIntoDocument(
          <Provider initialData={initialData} ><TestController ref={(ref) => component = ref} />
          </Provider>
        );
      });

      it('should be accessible via getInitialData', () => {
        expect(component.context.getInitialData()).toEqual({data: 'some data'});
      });
    });

    describe('when is on window', () => {
      beforeEach(() => {
        window.__initialData__ = {data: 'some data'};
        TestUtils.renderIntoDocument(
          <Provider><TestController ref={(ref) => component = ref} /></Provider>
        );
      });

      it('should be accessible via getInitialData ONLY ONCE', () => {
        expect(component.context.getInitialData()).toEqual({data: 'some data'});
        expect(component.context.getInitialData()).toBeUndefined();
      });
    });

    describe('getUser()', () => {
      describe('when is in props', () => {
        beforeEach(() => {
          TestUtils.renderIntoDocument(
            <Provider initialData={initialData} user={user} >
              <TestController ref={(ref) => component = ref} />
            </Provider>
          );
        });

        it('should be accesible via getUser()', () => {
          expect(component.context.getUser()).toEqual({name: 'Bane'});
        });
      });

      describe('when is in window', () => {
        beforeEach(() => {
          window.__user__ = user;
          TestUtils.renderIntoDocument(
            <Provider initialData={initialData} ><TestController ref={(ref) => component = ref} />
            </Provider>
          );
        });

        it('should be accesible via getUser()', () => {
          expect(component.context.getUser()).toEqual({name: 'Bane'});
        });
      });
    });
  });
});
