import React from 'react';
import {shallow} from 'enzyme';
import {actions as formActions} from 'react-redux-form';

import EditPage from '../EditPage';
import PagesAPI from 'app/Pages/PagesAPI';
import PageCreator from 'app/Pages/components/PageCreator';
import RouteHandler from 'app/App/RouteHandler';

describe('EditPage', () => {
  let page = {_id: 'abc2', title: 'Page 1'};
  let component;
  let instance;
  let context;

  beforeEach(() => {
    spyOn(PagesAPI, 'get').and.returnValue(Promise.resolve([page]));
    RouteHandler.renderedFromServer = true;
    context = {store: {dispatch: jasmine.createSpy('dispatch')}};
    component = shallow(<EditPage />, {context});
    instance = component.instance();
  });

  it('should render a PageCreator', () => {
    expect(component.find(PageCreator).length).toBe(1);
  });

  describe('static requestState()', () => {
    it('should request page being edited', (done) => {
      EditPage.requestState({pageId: 'abc2'})
      .then((response) => {
        expect(PagesAPI.get).toHaveBeenCalledWith('abc2');
        expect(response.page.data).toBe(page);
        done();
      })
      .catch(done.fail);
    });
  });

  describe('setReduxState()', () => {
    it('should set page data', () => {
      spyOn(formActions, 'load').and.returnValue('PAGE DATA LOADED');
      instance.setReduxState({page: {data: 'data'}});
      expect(formActions.load).toHaveBeenCalledWith('page.data', 'data');
      expect(context.store.dispatch).toHaveBeenCalledWith('PAGE DATA LOADED');
    });
  });
});
