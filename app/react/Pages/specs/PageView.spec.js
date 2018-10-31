import React from 'react';

import { actions } from 'app/BasicReducer';
import { markdownDatasets } from 'app/Markdown';
import { shallow } from 'enzyme';
import PageViewer from 'app/Pages/components/PageViewer';
import PagesAPI from 'app/Pages/PagesAPI';
import RouteHandler from 'app/App/RouteHandler';
import ViewMetadataPanel from 'app/Library/components/ViewMetadataPanel';
import SelectMultiplePanelContainer from 'app/Library/containers/SelectMultiplePanelContainer';
import api from 'app/Search/SearchAPI';

import PageView from '../PageView';
import pageItemLists from '../utils/pageItemLists';

describe('PageView', () => {
  const page = { _id: 'abc2', title: 'Page 1', metadata: { content: 'originalContent' } };
  let component;
  let instance;
  let context;

  beforeEach(() => {
    let searchCalls = -1;
    spyOn(api, 'search').and.callFake(() => Promise.resolve({ rows: [`resultsFor:${searchCalls += 1}`] }));

    spyOn(PagesAPI, 'get').and.returnValue(Promise.resolve(page));
    spyOn(pageItemLists, 'generate').and.returnValue({
      content: 'parsedContent',
      params: ['?q=(a:1,b:2)', '', '?q=(x:1,y:!(%27array%27),limit:24)', '?order=metadata.form&treatAs=number'],
      options: [{}, { limit: 9 }, { limit: 0 }, { limit: 12 }]
    });

    RouteHandler.renderedFromServer = true;
    context = { store: { dispatch: jasmine.createSpy('dispatch') } };
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

  describe('static requestState()', () => {
    it('should request page for view', (done) => {
      PageView.requestState({ pageId: 'abc2' })
      .then((response) => {
        expect(PagesAPI.get).toHaveBeenCalledWith('abc2');
        expect(response.page.pageView).toEqual({ _id: 'abc2', title: 'Page 1', metadata: { content: 'originalContent' } });
        done();
      })
      .catch(done.fail);
    });

    it('should request each list inside the content limited to 6 items (default) or the passed value and set the state', (done) => {
      PageView.requestState({ pageId: 'abc2' })
      .then((response) => {
        expect(api.search.calls.count()).toBe(4);
        expect(JSON.parse(JSON.stringify(api.search.calls.argsFor(0)[0]))).toEqual({ a: 1, b: 2, limit: '6' });
        expect(api.search.calls.argsFor(1)[0]).toEqual({ filters: {}, types: [], limit: '9' });
        expect(JSON.parse(JSON.stringify(api.search.calls.argsFor(2)[0]))).toEqual({ x: 1, y: ['array'], limit: '6' });
        expect(api.search.calls.argsFor(3)[0]).toEqual({ filters: {}, types: [], limit: '12' });

        expect(response.page.itemLists.length).toBe(4);

        expect(response.page.itemLists[0].params).toBe('?q=(a:1,b:2)');
        expect(response.page.itemLists[0].items).toEqual(['resultsFor:0']);
        expect(response.page.itemLists[1].params).toBe('');
        expect(response.page.itemLists[1].items).toEqual(['resultsFor:1']);
        expect(response.page.itemLists[2].params).toBe('?q=(x:1,y:!(%27array%27),limit:24)');
        expect(response.page.itemLists[2].items).toEqual(['resultsFor:2']);
        expect(response.page.itemLists[3].params).toBe('?order=metadata.form&treatAs=number');
        expect(response.page.itemLists[3].items).toEqual(['resultsFor:3']);
        expect(response.page.itemLists[3].options).toEqual({ limit: 12 });
        done();
      })
      .catch(done.fail);
    });

    it('should request each dataset inside the content', (done) => {
      const markdownDatasetsResponse = { request1: 'url1', request2: 'url2' };
      spyOn(markdownDatasets, 'fetch').and.returnValue(Promise.resolve(markdownDatasetsResponse));

      PageView.requestState({ pageId: 'abc2' })
      .then((response) => {
        expect(response.page.datasets).toEqual(markdownDatasetsResponse);
        done();
      })
      .catch(done.fail);
    });
  });

  describe('closeSidePanel', () => {
    it('should unselectAllDocuments', () => {
      instance.closeSidePanel();
      expect(context.store.dispatch).toHaveBeenCalledWith({ __reducerKey: 'library', type: 'UNSELECT_ALL_DOCUMENTS' });
    });
  });

  describe('setReduxState()', () => {
    it('should set pageView data', () => {
      spyOn(actions, 'set').and.callFake((path) => {
        switch (path) {
        case 'page/pageView':
          return 'PAGE DATA SET';
        case 'page/itemLists':
          return 'ITEM LISTS DATA SET';
        case 'page/datasets':
          return 'PAGE DATASETS DATA SET';
        default:
          return null;
        }
      });

      instance.setReduxState({ page: { pageView: 'data', itemLists: 'lists' } });
      expect(actions.set).toHaveBeenCalledWith('page/pageView', 'data');
      expect(actions.set).toHaveBeenCalledWith('page/itemLists', 'lists');
      expect(context.store.dispatch).toHaveBeenCalledWith('PAGE DATA SET');
      expect(context.store.dispatch).toHaveBeenCalledWith('ITEM LISTS DATA SET');
      expect(context.store.dispatch).toHaveBeenCalledWith('PAGE DATASETS DATA SET');
    });
  });
});
