import RouteHandler from 'app/App/RouteHandler';
import { actions } from 'app/BasicReducer';
import ViewMetadataPanel from 'app/Library/components/ViewMetadataPanel';
import SelectMultiplePanelContainer from 'app/Library/containers/SelectMultiplePanelContainer';
import { PageViewer } from 'app/Pages/components/PageViewer';
import { RequestParams } from 'app/utils/RequestParams';
import { shallow } from 'enzyme';
import React from 'react';

import PageView from '../PageView';
import * as assetsUtils from '../utils/getPageAssets';

describe('PageView', () => {
  let component;
  let instance;
  let context;

  beforeEach(() => {
    RouteHandler.renderedFromServer = true;
    context = { store: { getState: () => ({}), dispatch: jasmine.createSpy('dispatch') } };
    component = shallow(<PageView />, { context });
    instance = component.instance();
    spyOn(assetsUtils, 'getPageAssets').and.returnValue(
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
});
