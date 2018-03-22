import React from 'react';
import {shallow} from 'enzyme';
import {Pages} from '../Pages';
import PagesAPI from 'app/Pages/PagesAPI';
import PagesList from 'app/Pages/components/PagesList';

describe('Pages', () => {
  let component;
  let instance;
  let context;
  let pages = [{_id: 1, name: 'Page 1'}];

  beforeEach(() => {
    context = {store: {dispatch: jasmine.createSpy('dispatch')}};

    spyOn(PagesAPI, 'list').and.returnValue(Promise.resolve(pages));
    component = shallow(<Pages />, {context});

    instance = component.instance();
  });

  describe('requestState', () => {
    it('should get the current user, and metadata', (done) => {
      Pages.requestState()
      .then((state) => {
        expect(state.pages).toEqual(pages);
        done();
      });
    });
  });

  describe('setReduxState', () => {
    it('should set pages in state', () => {
      instance.setReduxState({pages: 'pages'});
      expect(context.store.dispatch).toHaveBeenCalledWith({type: 'pages/SET', value: 'pages'});
    });
  });

  describe('render', () => {
    it('should render a PagesList', () => {
      expect(component.find(PagesList).length).toBe(1);
    });
  });
});
