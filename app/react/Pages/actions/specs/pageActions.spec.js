/**
 * @jest-environment jsdom
 */
import { browserHistory } from 'react-router';
import { actions as formActions } from 'react-redux-form';
import { RequestParams } from 'app/utils/RequestParams';

import { actions as basicActions } from 'app/BasicReducer';
import { notificationActions } from 'app/Notifications';
import api from 'app/Pages/PagesAPI';

import * as actions from '../pageActions';

describe('Page actions', () => {
  let dispatch;

  beforeEach(() => {
    dispatch = jasmine.createSpy('dispatch');
    spyOn(api, 'save').and.returnValue(
      Promise.resolve({ _id: 'newId', sharedId: 'newSharedId', _rev: 'newRev' })
    );
    spyOn(api, 'delete').and.returnValue(Promise.resolve());
    spyOn(formActions, 'reset').and.returnValue('PAGE DATA RESET');
    spyOn(formActions, 'merge').and.returnValue('PAGE DATA MERGED');
    spyOn(basicActions, 'remove').and.returnValue('PAGE REMOVED');
    spyOn(notificationActions, 'notify').and.returnValue('NOTIFIED');
    spyOn(browserHistory, 'push');
  });

  describe('resetPage', () => {
    it('should dispatch a reset on page data', () => {
      actions.resetPage()(dispatch);
      expect(formActions.reset).toHaveBeenCalledWith('page.data');
      expect(dispatch).toHaveBeenCalledWith('PAGE DATA RESET');
    });
  });

  describe('savePage', () => {
    it('should dispatch a saving page and save the data', () => {
      actions.savePage('data')(dispatch);
      expect(dispatch.calls.count()).toBe(1);
      expect(dispatch).toHaveBeenCalledWith({ type: 'SAVING_PAGE' });
      expect(api.save).toHaveBeenCalledWith(new RequestParams('data'));
    });

    describe('upon success', () => {
      beforeEach(done => {
        actions
          .savePage('data')(dispatch)
          .then(() => {
            done();
          });
      });

      it('should dispatch a page saved with response', () => {
        expect(dispatch).toHaveBeenCalledWith({
          type: 'PAGE_SAVED',
          data: { _id: 'newId', sharedId: 'newSharedId', _rev: 'newRev' },
        });
      });

      it('should merge response data', () => {
        expect(formActions.merge).toHaveBeenCalledWith('page.data', {
          _id: 'newId',
          sharedId: 'newSharedId',
          _rev: 'newRev',
        });
        expect(dispatch).toHaveBeenCalledWith('PAGE DATA MERGED');
      });

      it('should notify saved successfully', () => {
        expect(notificationActions.notify).toHaveBeenCalledWith('Saved successfully.', 'success');
        expect(dispatch).toHaveBeenCalledWith('NOTIFIED');
      });

      it('should navigate to pages edit with the sharedId', () => {
        expect(browserHistory.push).toHaveBeenCalledWith('/settings/pages/edit/newSharedId');
      });
    });
    describe('on error', () => {
      it('should dispatch page saved', done => {
        api.save.and.callFake(() => Promise.reject(new Error()));
        actions
          .savePage('data')(dispatch)
          .then(() => {
            expect(dispatch).toHaveBeenCalledWith({ type: 'PAGE_SAVED', data: {} });
            done();
          });
      });
    });
  });

  describe('deletePage', () => {
    const data = { sharedId: 'page1', _id: 'id' };
    it('should delete the page', () => {
      actions.deletePage(data)(dispatch);
      expect(api.delete).toHaveBeenCalledWith(new RequestParams({ sharedId: 'page1' }));
    });

    describe('upon success', () => {
      beforeEach(done => {
        actions
          .deletePage(data)(dispatch)
          .then(() => {
            done();
          });
      });

      it('should remove page', () => {
        expect(basicActions.remove).toHaveBeenCalledWith('pages', data);
        expect(dispatch).toHaveBeenCalledWith('PAGE REMOVED');
      });
    });
  });
});
