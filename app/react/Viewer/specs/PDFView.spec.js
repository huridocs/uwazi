/**
 * @format
 * @jest-environment jsdom
 */

import React from 'react';
import { fromJS } from 'immutable';
import entitiesAPI from 'app/Entities/EntitiesAPI';
import { actions } from 'app/BasicReducer';
import { browserHistory } from 'react-router';
import { shallow } from 'enzyme';
import PDFView from 'app/Viewer/PDFView';
import Viewer from 'app/Viewer/components/Viewer';
import RouteHandler from 'app/App/RouteHandler';
import * as utils from 'app/utils';
import { RequestParams } from 'app/utils/RequestParams';
import * as routeActions from '../actions/routeActions';
import * as uiActions from '../actions/uiActions';

describe('PDFView', () => {
  let component;
  let instance;
  let context;
  let props;

  const render = () => {
    RouteHandler.renderedFromServer = true;
    component = shallow(<PDFView {...props} />, { context });
    instance = component.instance();
  };

  beforeEach(() => {
    const dispatch = jasmine.createSpy('dispatch');
    context = {
      store: {
        getState: () => ({}),
        dispatch: dispatch.and.callFake(action =>
          typeof action === 'function' ? action(dispatch) : action
        ),
      },
    };
    props = { location: { query: {} }, routes: [] };

    render();

    spyOn(routeActions, 'requestViewerState');

    spyOn(routeActions, 'setViewerState').and.returnValue({ type: 'setViewerState' });
  });

  it('should pass down raw property', () => {
    props.location = { query: { raw: 'true', page: 2 } };
    render();
    expect(component.find(Viewer).props().raw).toEqual(true);
  });

  describe('when on server', () => {
    it('should always pass raw true', () => {
      props.location = { query: { raw: 'false' } };
      utils.isClient = false;
      render();
      expect(component.find(Viewer).props().raw).toBe(true);
      utils.isClient = true;
    });
  });

  it('should render the Viewer', () => {
    expect(component.find(Viewer).length).toBe(1);
  });

  describe('when raw', () => {
    it('should render link canonical to the not raw version', () => {
      props.location = { query: { raw: 'true', page: 1 }, pathname: 'pathname' };
      render();
      expect(component.find('link')).toMatchSnapshot();
    });
  });

  describe('when not raw', () => {
    it('should not render link canonical', () => {
      props.location = { query: { raw: 'false', page: 1 }, pathname: 'pathname' };
      render();
      expect(component.find('link').length).toBe(0);
    });
  });

  describe('static requestState', () => {
    it('should call on requestViewerState', () => {
      const requestParams = new RequestParams({
        documentId: 'documentId',
        lang: 'es',
        page: 4,
        raw: 'true',
      });
      PDFView.requestState(requestParams, 'globalResources');
      expect(routeActions.requestViewerState).toHaveBeenCalledWith(
        new RequestParams({ documentId: 'documentId', lang: 'es', raw: true, page: 4 }),
        'globalResources'
      );
    });

    it('should modify raw to true if is server side rendered', () => {
      utils.isClient = false;
      const requestParams = new RequestParams({
        documentId: 'documentId',
        lang: 'es',
        raw: 'false',
      });
      PDFView.requestState(requestParams, 'globalResources');
      expect(routeActions.requestViewerState).toHaveBeenCalledWith(
        new RequestParams({ documentId: 'documentId', lang: 'es', raw: true }),
        'globalResources'
      );
    });
  });

  describe('onDocumentReady', () => {
    it('should scrollToPage on the query when not on raw mode', () => {
      spyOn(uiActions, 'scrollToPage');
      props.location = { query: { raw: 'false', page: 15 }, pathname: 'pathname' };
      render();

      instance.onDocumentReady();
      expect(uiActions.scrollToPage).toHaveBeenCalledWith(15, 0);

      props.location = { query: { raw: 'true', page: 15 }, pathname: 'pathname' };
      render();
      uiActions.scrollToPage.calls.reset();
      instance.onDocumentReady();
      expect(uiActions.scrollToPage).not.toHaveBeenCalled();
    });

    it('should activate text reference if query parameters have reference id', () => {
      spyOn(uiActions, 'activateReference');
      props.location = { query: { raw: 'false', ref: 'refId' }, pathname: 'pathname' };
      const pdfInfo = { 1: { chars: 100 } };
      const reference = { _id: 'refId', range: { start: 200, end: 300 }, text: 'test' };
      const doc = fromJS({
        pdfInfo,
        relationships: [{ _id: 'otherRef' }, reference],
      });
      render();
      instance.onDocumentReady(doc);
      expect(uiActions.activateReference).toHaveBeenCalledWith(reference, pdfInfo);
    });

    it('should emit documentLoaded event', () => {
      spyOn(uiActions, 'scrollToPage');
      spyOn(utils.events, 'emit');
      render();

      instance.onDocumentReady();
      expect(utils.events.emit).toHaveBeenCalledWith('documentLoaded');
    });
  });

  describe('changePage', () => {
    describe('when raw', () => {
      it('should changeBrowserHistoryPage', () => {
        props.location = {
          query: { raw: true, anotherProp: 'test', page: 15 },
          pathname: 'pathname',
        };
        spyOn(uiActions, 'scrollToPage');
        render();
        spyOn(instance, 'changeBrowserHistoryPage');

        instance.changePage(16);
        expect(instance.changeBrowserHistoryPage).toHaveBeenCalledWith(16);
        expect(uiActions.scrollToPage).not.toHaveBeenCalled();
      });
    });

    describe('when not raw', () => {
      it('should scrollToPage', () => {
        props.location = {
          query: { raw: false, anotherProp: 'test', page: 15 },
          pathname: 'pathname',
        };
        spyOn(uiActions, 'scrollToPage');
        render();
        spyOn(instance, 'changeBrowserHistoryPage');

        instance.changePage(16);
        expect(instance.changeBrowserHistoryPage).not.toHaveBeenCalled();
        expect(uiActions.scrollToPage).toHaveBeenCalledWith(16);
      });
    });
  });

  describe('componentWillReceiveProps', () => {
    const setProps = newProps => {
      entitiesAPI.getRawPage.calls.reset();
      component.setProps(newProps);
      component.update();
    };

    beforeEach(() => {
      props.location = {
        query: { raw: 'true', anotherProp: 'test', page: 15 },
        pathname: 'pathname',
      };
      props.params = { sharedId: 'documentId' };
      spyOn(entitiesAPI, 'getRawPage').and.returnValue(Promise.resolve('raw text'));
      render();
    });

    it('should load raw page when page/raw changes and raw is true', async () => {
      setProps({ location: { query: { page: 15, raw: 'true' } } });
      expect(entitiesAPI.getRawPage).not.toHaveBeenCalled();

      setProps({ location: { query: { page: 16, raw: 'false' } } });
      expect(entitiesAPI.getRawPage).not.toHaveBeenCalled();

      entitiesAPI.getRawPage.calls.reset();
      await instance.componentWillReceiveProps({
        params: { sharedId: 'documentId' },
        location: { query: { page: 17, raw: 'true' } },
      });
      expect(context.store.dispatch).toHaveBeenCalledWith(
        actions.set('viewer/rawText', 'raw text')
      );
      expect(entitiesAPI.getRawPage).toHaveBeenCalledWith(
        new RequestParams({ sharedId: 'documentId', pageNumber: 17 })
      );
    });
  });

  describe('changeBrowserHistoryPage', () => {
    it('should push new browserHistory with new page', () => {
      props.location = {
        query: { raw: true, anotherProp: 'test', page: 15 },
        pathname: 'pathname',
      };
      spyOn(browserHistory, 'push');
      render();

      instance.changeBrowserHistoryPage(16);
      expect(browserHistory.push).toHaveBeenCalledWith(
        'pathname?raw=true&anotherProp=test&page=16'
      );

      component.setProps({ location: { query: { raw: false, page: 15 }, pathname: 'pathname' } });
      component.update();
      instance.changeBrowserHistoryPage(16);
      expect(browserHistory.push).toHaveBeenCalledWith('pathname?page=16');
    });
  });
});
