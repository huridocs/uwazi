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
    let pagesClass;
    let dispatch;

    beforeEach(() => {
      pagesClass = new Pages({pamars: {}});
      dispatch = jasmine.createSpy('dispatch');
      pagesClass.context = {store: {dispatch}};
      pagesClass.setReduxState({pages: 'pages'});
    });

    it('should set pages in state', () => {
      expect(dispatch.calls.argsFor(0)).toEqual([{type: 'pages/SET', value: 'pages'}]);
    });
  });
});
