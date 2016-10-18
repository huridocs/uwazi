import React from 'react';
import {shallow} from 'enzyme';
import {actions} from 'app/BasicReducer';

import PageView from '../PageView';
import api from 'app/Search/SearchAPI';
import PagesAPI from 'app/Pages/PagesAPI';
import PageViewer from 'app/Pages/components/PageViewer';
import RouteHandler from 'app/App/RouteHandler';

import pageItemLists from '../utils/pageItemLists';

describe('PageView', () => {
  let page = {_id: 'abc2', title: 'Page 1', metadata: {content: 'originalContent'}};
  let component;
  let instance;
  let context;

  beforeEach(() => {
    let searchCalls = -1;
    spyOn(api, 'search').and.callFake(() => {
      return Promise.resolve({rows: ['resultsFor:' + (searchCalls += 1)]});
    });

    spyOn(PagesAPI, 'get').and.returnValue(Promise.resolve([page]));
    spyOn(pageItemLists, 'generate').and.returnValue({
      content: 'parsedContent',
      params: ['?a=1&b=2', '', '?x=1&y=2&limit=24']
    });

    RouteHandler.renderedFromServer = true;
    context = {store: {dispatch: jasmine.createSpy('dispatch')}};
    component = shallow(<PageView />, {context});
    instance = component.instance();
  });

  it('should render a PageViewer', () => {
    expect(component.find(PageViewer).length).toBe(1);
  });

  describe('static requestState()', () => {
    fit('should request page for view', (done) => {
      PageView.requestState({pageId: 'abc2'})
      .then((response) => {
        expect(PagesAPI.get).toHaveBeenCalledWith('abc2');
        expect(response.page.pageView).toEqual({_id: 'abc2', title: 'Page 1', metadata: {content: 'parsedContent'}});
        done();
      })
      .catch(done.fail);
    });

    fit('should request each list inside the content limited to 6 items and set the state', (done) => {
      PageView.requestState({pageId: 'abc2'})
      .then((response) => {
        expect(api.search.calls.count()).toBe(3);
        expect(JSON.stringify(api.search.calls.argsFor(0)[0])).toBe('{"a":"1","b":"2","limit":"6"}');
        expect(JSON.stringify(api.search.calls.argsFor(1)[0])).toEqual('{"filters":{},"types":[],"limit":"6"}');
        expect(JSON.stringify(api.search.calls.argsFor(2)[0])).toEqual('{"x":"1","y":"2","limit":"6"}');

        expect(response.page.itemLists.length).toBe(3);

        expect(response.page.itemLists[0].params).toBe('?a=1&b=2');
        expect(response.page.itemLists[0].items).toEqual(['resultsFor:0']);
        expect(response.page.itemLists[1].params).toBe('');
        expect(response.page.itemLists[1].items).toEqual(['resultsFor:1']);
        expect(response.page.itemLists[2].params).toBe('?x=1&y=2&limit=24');
        expect(response.page.itemLists[2].items).toEqual(['resultsFor:2']);
        done();
      })
      .catch(done.fail);
    });
  });

  describe('setReduxState()', () => {
    fit('should set pageView data', () => {
      spyOn(actions, 'set').and.callFake(path => {
        if (path === 'page/pageView') {
          return 'PAGE DATA SET';
        }
        if (path === 'page/itemLists') {
          return 'ITEM LISTS DATA SET';
        }
      });

      instance.setReduxState({page: {pageView: 'data', itemLists: 'lists'}});
      expect(actions.set).toHaveBeenCalledWith('page/pageView', 'data');
      expect(actions.set).toHaveBeenCalledWith('page/itemLists', 'lists');
      expect(context.store.dispatch).toHaveBeenCalledWith('PAGE DATA SET');
      expect(context.store.dispatch).toHaveBeenCalledWith('ITEM LISTS DATA SET');
    });
  });
});
