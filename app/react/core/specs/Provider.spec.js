import React, { Component, PropTypes } from 'react'
import backend from 'fetch-mock'
import TestUtils from 'react-addons-test-utils'
import {APIURL} from '../../config.js'
import RouteHandler from '../RouteHandler';
import Provider from '../Provider'

describe('Provider', () => {

  let component;
  let initialData = {data: 'some data'};
  let user = {name: 'Bane'}

  class TestController extends Component {

    static contextTypes = { getInitialData: PropTypes.func, getUser: PropTypes.func }

    constructor(props, context) {
      super(props, context);
      this.state = {};
      this.context = context;
    }

    static requestState () {
      return Promise.resolve({initialData:'data'});
    }

    render = () => {return <div/>}
  }

  afterEach(() => {
    window.__initialData__ = undefined;
    window.__user__ = undefined;
  })


  describe('context', () => {
    it('should be provided to RouteHandler with getInitialData', () => {
      TestUtils.renderIntoDocument(<Provider initialData={initialData} ><TestController ref={(ref) => component = ref} /></Provider>);
      expect(component.context.getInitialData).toEqual(jasmine.any(Function));
    });

    it('should be provided to RouteHandler with getUser', () => {
      TestUtils.renderIntoDocument(<Provider initialData={initialData} user={user} ><TestController ref={(ref) => component = ref} /></Provider>);
      expect(component.context.getUser).toEqual(jasmine.any(Function));
    });
  });

  describe('getInitialData()', () => {
    describe('when is in props', () => {

      beforeEach(() => {
        TestUtils.renderIntoDocument(<Provider initialData={initialData} ><TestController ref={(ref) => component = ref} /></Provider>);
      });

      it('should be accessible via getInitialData', () => {
        expect(component.context.getInitialData()).toEqual({data: 'some data'});
      });
    });

    describe('when is on window', () => {

      beforeEach(() => {
        window.__initialData__ = {data: 'some data'};
        TestUtils.renderIntoDocument(<Provider><TestController ref={(ref) => component = ref} /></Provider>);
      });

      it('should be accessible via getInitialData ONLY ONCE', () => {
        expect(component.context.getInitialData()).toEqual({data: 'some data'});
        expect(component.context.getInitialData()).toBe(undefined);
      });
    });

    describe('getUser()', () => {
      describe('when is in props', () => {

        beforeEach(() => {
          TestUtils.renderIntoDocument(<Provider initialData={initialData} user={user} ><TestController ref={(ref) => component = ref} /></Provider>);
        });

        it('should be accesible via getUser()', () => {
          expect(component.context.getUser()).toEqual({name: 'Bane'});
        })
      });

      describe('when is in window', () => {

        beforeEach(() => {
          window.__user__ = user;
          TestUtils.renderIntoDocument(<Provider initialData={initialData} ><TestController ref={(ref) => component = ref} /></Provider>);
        });

        it('should be accesible via getUser()', () => {
          expect(component.context.getUser()).toEqual({name: 'Bane'});
        })
      });
    });
  })


});
