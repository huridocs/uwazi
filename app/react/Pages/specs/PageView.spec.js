/**
 * @jest-environment jsdom
 */
import React from 'react';
import RouteHandler from 'app/App/RouteHandler';
import { shallow } from 'enzyme';
import { actions } from 'app/BasicReducer';
import ViewMetadataPanel from 'app/Library/components/ViewMetadataPanel';
import SelectMultiplePanelContainer from 'app/Library/containers/SelectMultiplePanelContainer';
import { PageViewer } from 'app/Pages/components/PageViewer';
import { RequestParams } from 'app/utils/RequestParams';

import { ErrorFallback } from 'app/V2/Components/ErrorHandling';
import { renderConnectedMount } from 'app/utils/test/renderConnected';
import PageView from '../PageView';
import * as assetsUtils from '../utils/getPageAssets';

describe('PageView', () => {
  let component;
  let instance;
  let context;
  let assetsUtilsSpy;

  beforeEach(() => {
    RouteHandler.renderedFromServer = true;
    context = { store: { getState: () => ({}), dispatch: jasmine.createSpy('dispatch') } };
    component = shallow(<PageView />, { context });
    instance = component.instance();
    assetsUtilsSpy = spyOn(assetsUtils, 'getPageAssets').and.returnValue(
      Promise.resolve({
        pageView: 'pageViewValues',
        itemLists: 'itemListsValues',
        datasets: 'datasetsValues',
      })
    );
  });

  it('should render a PageViewer', () => {
    expect(component.find(PageViewer).length).toBe(1);
  });

  it('should render a ViewMetadataPanel', () => {
    expect(component.find(ViewMetadataPanel).length).toBe(1);
    expect(component.find(ViewMetadataPanel).props().storeKey).toBe('library');
  });

  it('should render SelectMultiplePanelContainer', () => {
    expect(component.find(SelectMultiplePanelContainer).length).toBe(1);
    expect(component.find(SelectMultiplePanelContainer).props().storeKey).toBe('library');
  });

  describe('onunmount', () => {
    it('should emptyState', () => {
      spyOn(instance, 'emptyState');

      component.unmount();

      expect(instance.emptyState).toHaveBeenCalled();
    });
  });

  describe('emptyState', () => {
    it('should closeSidePanel, and unset sate data', () => {
      spyOn(instance, 'closeSidePanel');
      instance.emptyState();

      expect(instance.closeSidePanel).toHaveBeenCalled();
      expect(context.store.dispatch).toHaveBeenCalledWith(actions.unset('page/pageView'));
      expect(context.store.dispatch).toHaveBeenCalledWith(actions.unset('page/itemLists'));
      expect(context.store.dispatch).toHaveBeenCalledWith(actions.unset('page/datasets'));
    });
  });

  describe('closeSidePanel', () => {
    it('should unselectAllDocuments', () => {
      instance.closeSidePanel();
      expect(context.store.dispatch).toHaveBeenCalled();
    });
  });

  describe('Static requestState()', () => {
    it('should request page assets for view and set actions', async () => {
      const request = new RequestParams({ sharedId: 'abc2' }, 'headers');
      const stateActions = await PageView.requestState(request);
      expect(assetsUtils.getPageAssets).toHaveBeenCalledWith(request);
      expect(stateActions).toEqual([
        { type: 'page/pageView/SET', value: 'pageViewValues' },
        { type: 'page/itemLists/SET', value: 'itemListsValues' },
        { type: 'page/datasets/SET', value: 'datasetsValues' },
      ]);
    });
  });

  describe('error handling', () => {
    describe('when a server side error happens', () => {
      it('should render a fallback UI as error boundary', () => {
        const consoleErrorSpy = jasmine.createSpy('consoleErrorSpy');
        spyOn(console, 'error').and.callFake(consoleErrorSpy);
        assetsUtilsSpy.and.returnValue(Promise.reject(new Error('error at rendering')));
        component = renderConnectedMount(PageView, { context }, {}, true);
        const errorMessage = component.find(ErrorFallback).find('.font-bold').at(0).text();

        expect(errorMessage).toEqual('Well, this is awkward...');
      });
    });
  });
});
