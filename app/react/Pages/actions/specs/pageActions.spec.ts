/**
 * @jest-environment jsdom
 */
import { actions as formActions } from 'react-redux-form';
import { RequestParams } from 'app/utils/RequestParams';

import { actions as basicActions } from 'app/BasicReducer';
import { notificationActions } from 'app/Notifications';
import api from 'app/Pages/PagesAPI';

import * as actions from '../pageActions';

describe('Page actions', () => {
  let dispatch: jasmine.Spy;
  let apiSave: jasmine.Spy;
  const navigateSpy = jest.fn();

  // eslint-disable-next-line max-statements
  beforeEach(() => {
    dispatch = jasmine.createSpy('dispatch');
    apiSave = jasmine
      .createSpy()
      .and.callFake(async () =>
        Promise.resolve({ _id: 'newId', sharedId: 'newSharedId', _rev: 'newRev' })
      );
    api.save = apiSave;
    spyOn(api, 'delete').and.callFake(async () => Promise.resolve());
    spyOn(api, 'get').and.callFake(async () => Promise.resolve());
    spyOn(formActions, 'reset').and.returnValue('PAGE DATA RESET');
    spyOn(formActions, 'merge').and.returnValue('PAGE DATA MERGED');
    spyOn(formActions, 'change').and.returnValue('MODEL VALUE UPDATED');
    spyOn(basicActions, 'remove').and.returnValue('PAGE REMOVED');
    spyOn(notificationActions, 'notify').and.returnValue('NOTIFIED');
  });

  describe('resetPage', () => {
    it('should dispatch a reset on page data', () => {
      actions.resetPage()(dispatch);
      expect(formActions.reset).toHaveBeenCalledWith('page.data');
      expect(dispatch).toHaveBeenCalledWith('PAGE DATA RESET');
    });
  });

  describe('savePage', () => {
    it('should dispatch a saving page and save the data', async () => {
      dispatch.calls.reset();
      await actions.savePage({ title: 'A title' }, navigateSpy)(dispatch);
      expect(dispatch.calls.count()).toBe(4);
      expect(dispatch).toHaveBeenCalledWith({ type: 'SAVING_PAGE' });
      expect(api.save).toHaveBeenCalledWith(new RequestParams({ title: 'A title' }));
      expect(navigateSpy).toHaveBeenCalledWith('/settings/pages/edit/newSharedId');
    });

    describe('upon success', () => {
      beforeEach(async () => {
        await actions.savePage({ title: 'A title' }, navigateSpy)(dispatch);
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
        expect(navigateSpy).toHaveBeenCalledWith('/settings/pages/edit/newSharedId');
      });
    });
    describe('on error', () => {
      it('should dispatch page saved', done => {
        apiSave.and.callFake(async () => Promise.reject(new Error()));
        actions
          .savePage(
            { title: 'A title' },
            navigateSpy
          )(dispatch)
          .then(() => {
            expect(dispatch).toHaveBeenCalledWith({ type: 'PAGE_SAVED', data: {} });
            done();
          });
      });
    });
  });

  describe('deletePage', () => {
    const data = { sharedId: 'page1', _id: 'id', title: 'A title' };
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

  describe('updateValue', () => {
    it('should update the model with the provided value', () => {
      actions.updateValue('.modelName', 'someValue')(dispatch);
      expect(formActions.change).toHaveBeenCalledWith('page.data.modelName', 'someValue');
      expect(dispatch).toHaveBeenCalledWith('MODEL VALUE UPDATED');
    });
  });

  describe('loadPages', () => {
    it('should get the pages', async () => {
      actions
        .loadPages()(dispatch)
        .catch(() => fail('should not fail'));
      expect(api.get).toHaveBeenCalledWith(new RequestParams());
    });
  });
});
