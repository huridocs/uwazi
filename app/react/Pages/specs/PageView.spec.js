import React from 'react';
import {shallow} from 'enzyme';
import {actions} from 'app/BasicReducer';

import PageView from '../PageView';
import PagesAPI from 'app/Pages/PagesAPI';
import PageViewer from 'app/Pages/components/PageViewer';
import RouteHandler from 'app/App/RouteHandler';

describe('PageView', () => {
  let page = {_id: 'abc2', title: 'Page 1'};
  let component;
  let instance;
  let context;

  beforeEach(() => {
    spyOn(PagesAPI, 'get').and.returnValue(Promise.resolve([page]));
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
        expect(response.page.pageView).toBe(page);
        done();
      })
      .catch(done.fail);
    });
  });

  describe('setReduxState()', () => {
    it('should set pageView data', () => {
      spyOn(actions, 'set').and.returnValue('PAGE DATA SET');
      instance.setReduxState({page: {pageView: 'data'}});
      expect(actions.set).toHaveBeenCalledWith('page/pageView', 'data');
      expect(context.store.dispatch).toHaveBeenCalledWith('PAGE DATA SET');
    });
  });
});
