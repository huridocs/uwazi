import React from 'react';
import {shallow} from 'enzyme';
import {actions} from 'app/BasicReducer';

import PageView from '../PageView';
import api from 'app/Search/SearchAPI';
import TemplatesAPI from 'app/Templates/TemplatesAPI';
import ThesaurisAPI from 'app/Thesauris/ThesaurisAPI';
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

    spyOn(PagesAPI, 'get').and.returnValue(Promise.resolve(page));
    spyOn(TemplatesAPI, 'get').and.returnValue(Promise.resolve('templates'));
    spyOn(ThesaurisAPI, 'get').and.returnValue(Promise.resolve('thesauris'));
    spyOn(pageItemLists, 'generate').and.returnValue({
      content: 'parsedContent',
      params: ['?q=(a:1,b:2)', '', '?q=(x:1,y:!(%27array%27),limit:24)', '?order=metadata.form&treatAs=number'],
      options: [{}, {limit: 9}, {limit: 0}, {limit: 12}]
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
    it('should request page for view', (done) => {
      PageView.requestState({pageId: 'abc2'})
      .then((response) => {
        expect(PagesAPI.get).toHaveBeenCalledWith('abc2');
        expect(response.page.pageView).toEqual({_id: 'abc2', title: 'Page 1', metadata: {content: 'parsedContent'}});
        done();
      })
      .catch(done.fail);
    });

    it('should request each list inside the content limited to 6 items (default) or the passed value and set the state', (done) => {
      PageView.requestState({pageId: 'abc2'})
      .then((response) => {
        expect(api.search.calls.count()).toBe(4);
        expect(JSON.parse(JSON.stringify(api.search.calls.argsFor(0)[0]))).toEqual({a: 1, b: 2, limit: '6'});
        expect(api.search.calls.argsFor(1)[0]).toEqual({filters: {}, types: [], limit: '9'});
        expect(JSON.parse(JSON.stringify(api.search.calls.argsFor(2)[0]))).toEqual({x: 1, y: ['array'], limit: '6'});
        expect(api.search.calls.argsFor(3)[0]).toEqual({filters: {}, types: [], limit: '12'});

        expect(response.page.itemLists.length).toBe(4);

        expect(response.page.itemLists[0].params).toBe('?q=(a:1,b:2)');
        expect(response.page.itemLists[0].items).toEqual(['resultsFor:0']);
        expect(response.page.itemLists[1].params).toBe('');
        expect(response.page.itemLists[1].items).toEqual(['resultsFor:1']);
        expect(response.page.itemLists[2].params).toBe('?q=(x:1,y:!(%27array%27),limit:24)');
        expect(response.page.itemLists[2].items).toEqual(['resultsFor:2']);
        expect(response.page.itemLists[3].params).toBe('?order=metadata.form&treatAs=number');
        expect(response.page.itemLists[3].items).toEqual(['resultsFor:3']);
        done();
      })
      .catch(done.fail);
    });

    it('should set the state templates and thesauris', (done) => {
      PageView.requestState({pageId: 'abc2'})
      .then((response) => {
        expect(response.templates).toBe('templates');
        expect(response.thesauris).toBe('thesauris');
        done();
      });
    });
  });

  describe('setReduxState()', () => {
    it('should set pageView data', () => {
      spyOn(actions, 'set').and.callFake(path => {
        switch (path) {
        case 'page/pageView':
          return 'PAGE DATA SET';
        case 'page/itemLists':
          return 'ITEM LISTS DATA SET';
        case 'templates':
          return 'TEMPLATES SET';
        case 'thesauris':
          return 'THESAURIS SET';
        default:
          return;
        }
      });

      instance.setReduxState({page: {pageView: 'data', itemLists: 'lists'}});
      expect(actions.set).toHaveBeenCalledWith('page/pageView', 'data');
      expect(actions.set).toHaveBeenCalledWith('page/itemLists', 'lists');
      expect(context.store.dispatch).toHaveBeenCalledWith('TEMPLATES SET');
      expect(context.store.dispatch).toHaveBeenCalledWith('THESAURIS SET');
      expect(context.store.dispatch).toHaveBeenCalledWith('PAGE DATA SET');
      expect(context.store.dispatch).toHaveBeenCalledWith('ITEM LISTS DATA SET');
    });
  });
});
