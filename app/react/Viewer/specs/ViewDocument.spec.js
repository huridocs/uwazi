import React from 'react';
import entitiesAPI from 'app/Entities/EntitiesAPI';
import { actions } from 'app/BasicReducer';

import { browserHistory } from 'react-router';
import { shallow } from 'enzyme';
import ViewDocument from 'app/Viewer/ViewDocument';
import Viewer from 'app/Viewer/components/Viewer';
import * as relationships from 'app/Relationships/utils/routeUtils';
import * as utils from 'app/utils';

import * as routeActions from '../actions/routeActions';
import * as uiActions from '../actions/uiActions';


describe('ViewDocument', () => {
  let component;
  let instance;
  let context;
  let props;

  const render = () => {
    component = shallow(<ViewDocument {...props} renderedFromServer />, { context });
    instance = component.instance();
  };

  beforeEach(() => {
    const dispatch = jasmine.createSpy('dispatch');
    context = { store: { dispatch: dispatch.and.callFake((action) => {
      if (typeof action === 'function') {
        return action(dispatch);
      }
      return action;
    }) } };
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
      const query = { raw: 'true', page: 4 };
      ViewDocument.requestState({ documentId: 'documentId', lang: 'es' }, query, 'globalResources');

      expect(routeActions.requestViewerState).toHaveBeenCalledWith({ documentId: 'documentId', lang: 'es', raw: true, page: 4 }, 'globalResources');
    });

    it('should modify raw to true if is server side rendered', () => {
      utils.isClient = false;
      const query = { raw: 'false' };
      ViewDocument.requestState({ documentId: 'documentId', lang: 'es' }, query, 'globalResources');
      expect(routeActions.requestViewerState).toHaveBeenCalledWith({ documentId: 'documentId', lang: 'es', raw: true }, 'globalResources');
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
        props.location = { query: { raw: true, anotherProp: 'test', page: 15 }, pathname: 'pathname' };
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
        props.location = { query: { raw: false, anotherProp: 'test', page: 15 }, pathname: 'pathname' };
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
    it('should load raw page when page/raw changes and raw is true', (done) => {
      props.location = { query: { raw: 'true', anotherProp: 'test', page: 15 }, pathname: 'pathname' };
      props.params = { documentId: 'documentId' };
      spyOn(entitiesAPI, 'getRawPage').and.returnValue(Promise.resolve('raw text'));
      render();

      entitiesAPI.getRawPage.calls.reset();
      component.setProps({ location: { query: { page: 15, raw: 'true' } } });
      component.update();
      expect(entitiesAPI.getRawPage).not.toHaveBeenCalled();

      entitiesAPI.getRawPage.calls.reset();
      component.setProps({ location: { query: { page: 16, raw: 'false' } } });
      component.update();
      expect(entitiesAPI.getRawPage).not.toHaveBeenCalled();

      entitiesAPI.getRawPage.calls.reset();
      instance.componentWillReceiveProps({ params: { documentId: 'documentId' }, location: { query: { page: 17, raw: 'true' } } })
      .then(() => {
        expect(context.store.dispatch).toHaveBeenCalledWith(actions.set('viewer/rawText', 'raw text'));
        expect(entitiesAPI.getRawPage).toHaveBeenCalledWith('documentId', 17);
        done();
      });
    });
  });

  describe('changeBrowserHistoryPage', () => {
    it('should push new browserHistory with new page', () => {
      props.location = { query: { raw: true, anotherProp: 'test', page: 15 }, pathname: 'pathname' };
      spyOn(browserHistory, 'push');
      render();

      instance.changeBrowserHistoryPage(16);
      expect(browserHistory.push).toHaveBeenCalledWith('pathname?raw=true&anotherProp=test&page=16');

      component.setProps({ location: { query: { raw: false, page: 15 }, pathname: 'pathname' } });
      component.update();
      instance.changeBrowserHistoryPage(16);
      expect(browserHistory.push).toHaveBeenCalledWith('pathname?page=16');
    });
  });

  describe('setReduxState()', () => {
    it('should dispatch setViewerState', () => {
      instance.setReduxState('state');
      expect(routeActions.setViewerState).toHaveBeenCalledWith('state');
      expect(context.store.dispatch).toHaveBeenCalledWith({ type: 'setViewerState' });
    });
  });

  describe('componentWillUnmount()', () => {
    it('should call emptyState', () => {
      spyOn(instance, 'emptyState');
      instance.componentWillUnmount();

      expect(instance.emptyState).toHaveBeenCalled();
    });
  });

  describe('emptyState()', () => {
    beforeEach(() => {
      spyOn(relationships, 'emptyState').and.returnValue({ type: 'relationshipsEmptyState' });
    });

    it('should unset the state', () => {
      instance.emptyState();
      expect(context.store.dispatch).toHaveBeenCalledWith({ type: 'SET_REFERENCES', references: [] });
      expect(context.store.dispatch).toHaveBeenCalledWith({ type: 'viewer/doc/UNSET' });
      expect(context.store.dispatch).toHaveBeenCalledWith({ type: 'viewer/templates/UNSET' });
      expect(context.store.dispatch).toHaveBeenCalledWith({ type: 'viewer/thesauris/UNSET' });
      expect(context.store.dispatch).toHaveBeenCalledWith({ type: 'viewer/relationTypes/UNSET' });
      expect(context.store.dispatch).toHaveBeenCalledWith({ type: 'viewer/rawText/UNSET' });
      expect(context.store.dispatch).toHaveBeenCalledWith({ type: 'rrf/reset', model: 'documentViewer.tocForm' });
      expect(context.store.dispatch).toHaveBeenCalledWith({ type: 'viewer/targetDoc/UNSET' });
      expect(context.store.dispatch).toHaveBeenCalledWith({ type: 'relationshipsEmptyState' });
    });
  });
});
