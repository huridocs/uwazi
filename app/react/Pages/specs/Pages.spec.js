import React from 'react';
import {shallow} from 'enzyme';
import {Pages} from '../Pages';
import PagesAPI from '../PagesAPI';

describe('Pages', () => {
  describe('requestState', () => {
    let pages = [{_id: 1, name: 'Page 1'}];

    beforeEach(() => {
      spyOn(PagesAPI, 'list').and.returnValue(Promise.resolve(pages));
    });

    it('should get the current user, and metadata', (done) => {
      Pages.requestState()
      .then((state) => {
        expect(state.pages).toEqual(pages);
        done();
      });
    });
  });

  describe('setReduxState', () => {
    let instance;
    let context;

    beforeEach(() => {
      context = {store: {dispatch: jasmine.createSpy('dispatch')}};
      instance = shallow(<Pages />, {context}).instance();
    });

    it('should set pages in state', () => {
      instance.setReduxState({pages: 'pages'});
      expect(context.store.dispatch).toHaveBeenCalledWith({type: 'pages/SET', value: 'pages'});
    });
  });
});
