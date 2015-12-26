import React, { Component, PropTypes } from 'react'
import backend from 'fetch-mock'
import TestUtils from 'react-addons-test-utils'
import {APIURL} from '../../config.js'
import RouteHandler from '../RouteHandler';
import Provider from '../Provider'

describe('Provider', () => {

  let component;
  let initialData = {data: 'some data'};

  class TestController extends Component {

    static contextTypes = { getInitialData: PropTypes.func }

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


  describe('context', () => {
    it('should be provided to RouteHandler with getInitialData', () => {
      TestUtils.renderIntoDocument(<Provider initialData={initialData} ><TestController ref={(ref) => component = ref} /></Provider>);
      expect(component.context.getInitialData).toEqual(jasmine.any(Function));
    });
  });

  describe('when initialData is in props', () => {

    beforeEach(() => {
      TestUtils.renderIntoDocument(<Provider initialData={initialData} ><TestController ref={(ref) => component = ref} /></Provider>);
    });

    it('should be accessible via getInitialData', () => {
      expect(component.context.getInitialData()).toEqual({data: 'some data'});
    });
  });

  describe('when initialData is on window', () => {

    beforeEach(() => {
      window.__initialData__ = {data: 'some data'};
      TestUtils.renderIntoDocument(<Provider><TestController ref={(ref) => component = ref} /></Provider>);
    });

    it('should be accessible via getInitialData ONLY ONCE', () => {
      expect(component.context.getInitialData()).toEqual({data: 'some data'});
      expect(component.context.getInitialData()).toBe(undefined);
    });
  });
});
