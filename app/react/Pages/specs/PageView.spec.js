import RouteHandler from 'app/App/RouteHandler';
import { actions } from 'app/BasicReducer';
import ViewMetadataPanel from 'app/Library/components/ViewMetadataPanel';
import SelectMultiplePanelContainer from 'app/Library/containers/SelectMultiplePanelContainer';
import { markdownDatasets } from 'app/Markdown';
import { PageViewer } from 'app/Pages/components/PageViewer';
import PagesAPI from 'app/Pages/PagesAPI';
import api from 'app/Search/SearchAPI';
import { RequestParams } from 'app/utils/RequestParams';
import { shallow } from 'enzyme';
import React from 'react';
import PageView from '../PageView';
import pageItemLists from '../utils/pageItemLists';

describe('PageView', () => {
  let component;
  let instance;
  let context;

  beforeEach(() => {
    RouteHandler.renderedFromServer = true;
    context = { store: { getState: () => ({}), dispatch: jasmine.createSpy('dispatch') } };
    component = shallow(<PageView />, { context });
    instance = component.instance();
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
    const page = {
      _id: 'abc2',
      title: 'Page 1',
      metadata: /*non-metadata-object*/ { content: 'originalContent' },
    };

    let data;
    let request;

    beforeEach(() => {
      spyOn(PagesAPI, 'getById').and.returnValue(Promise.resolve(page));

      spyOn(pageItemLists, 'generate').and.returnValue({
        content: 'parsedContent',
        params: [
          '?q=(a:1,b:2)',
          '',
          '?q=(x:1,y:!(%27array%27),limit:24)',
          '?order=metadata.form&treatAs=number',
        ],
        options: [{}, { limit: 9 }, { limit: 0 }, { limit: 12 }],
      });

      let searchCalls = -1;
      spyOn(api, 'search').and.callFake(() => {
        searchCalls += 1;
        return Promise.resolve({ rows: [`resultsFor:${searchCalls}`] });
      });

      data = { sharedId: 'abc2' };
      request = new RequestParams(data, 'headers');
    });

    it('should request page for view', async () => {
      const stateActions = await PageView.requestState(request);

      expect(PagesAPI.getById).toHaveBeenCalledWith(request);
      expect(stateActions).toMatchSnapshot();
    });

    const assertItemLists = itemLists => {
      expect(itemLists.length).toBe(4);
      expect(itemLists[0].params).toBe('?q=(a:1,b:2)');
      expect(itemLists[0].items).toEqual(['resultsFor:0']);
      expect(itemLists[1].params).toBe('');
      expect(itemLists[1].items).toEqual(['resultsFor:1']);
      expect(itemLists[2].params).toBe('?q=(x:1,y:!(%27array%27),limit:24)');
      expect(itemLists[2].items).toEqual(['resultsFor:2']);
      expect(itemLists[3].params).toBe('?order=metadata.form&treatAs=number');
      expect(itemLists[3].items).toEqual(['resultsFor:3']);
      expect(itemLists[3].options).toEqual({ limit: 12 });
    };

    it('should request each list inside the content limited to 6 items (default) or the passed value and set the state', async () => {
      const stateActions = await PageView.requestState(request);

      expect(api.search.calls.count()).toBe(4);
      expect(JSON.parse(JSON.stringify(api.search.calls.argsFor(0)[0]))).toEqual({
        data: { a: 1, b: 2, limit: '6' },
        headers: 'headers',
      });
      expect(api.search.calls.argsFor(1)[0]).toEqual({
        data: { filters: {}, types: [], limit: '9' },
        headers: 'headers',
      });

      expect(JSON.parse(JSON.stringify(api.search.calls.argsFor(2)[0]))).toEqual({
        data: {
          x: 1,
          y: ['array'],
          limit: '6',
        },
        headers: 'headers',
      });
      expect(api.search.calls.argsFor(3)[0]).toEqual({
        data: { filters: {}, types: [], limit: '12' },
        headers: 'headers',
      });

      const itemLists = stateActions[1].value;
      assertItemLists(itemLists);
    });

    it('should request each dataset inside the content', async () => {
      const markdownDatasetsResponse = { request1: 'url1', request2: 'url2' };
      spyOn(markdownDatasets, 'fetch').and.returnValue(Promise.resolve(markdownDatasetsResponse));

      const stateActions = await PageView.requestState(request);
      expect(markdownDatasets.fetch).toHaveBeenCalledWith('originalContent', request.onlyHeaders());
      expect(stateActions[2].value).toEqual(markdownDatasetsResponse);
    });
  });
});
