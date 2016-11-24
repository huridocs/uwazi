import {actions as formActions} from 'react-redux-form';
import {actions as basicActions} from 'app/BasicReducer';
import {browserHistory} from 'react-router';
import * as actions from '../pageActions';
import * as Notifications from 'app/Notifications';
import api from 'app/Pages/PagesAPI';

describe('Page actions', () => {
  let dispatch;

  beforeEach(() => {
    dispatch = jasmine.createSpy('dispatch');
    spyOn(api, 'save').and.returnValue(Promise.resolve({_id: 'newId', sharedId: 'newSharedId', _rev: 'newRev'}));
    spyOn(api, 'delete').and.returnValue(Promise.resolve());
    spyOn(formActions, 'reset').and.returnValue('PAGE DATA RESET');
    spyOn(formActions, 'merge').and.returnValue('PAGE DATA MERGED');
    spyOn(basicActions, 'remove').and.returnValue('PAGE REMOVED');
    spyOn(Notifications, 'notify').and.returnValue('NOTIFIED');
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
      expect(dispatch).toHaveBeenCalledWith({type: 'SAVING_PAGE'});
      expect(api.save).toHaveBeenCalledWith('data');
    });

    describe('upon success', () => {
      beforeEach((done) => {
        spyOn(browserHistory, 'push');
        actions.savePage('data')(dispatch)
        .then(() => {
          done();
        });
      });

      it('should dispatch a page saved with response', () => {
        expect(dispatch).toHaveBeenCalledWith({type: 'PAGE_SAVED', data: {_id: 'newId', sharedId: 'newSharedId', _rev: 'newRev'}});
      });

      it('should merge response data', () => {
        expect(formActions.merge).toHaveBeenCalledWith('page.data', {_id: 'newId', sharedId: 'newSharedId', _rev: 'newRev'});
        expect(dispatch).toHaveBeenCalledWith('PAGE DATA MERGED');
      });

      it('should notify saved successfully', () => {
        expect(Notifications.notify).toHaveBeenCalledWith('Saved successfully.', 'success');
        expect(dispatch).toHaveBeenCalledWith('NOTIFIED');
      });

      it('should navigate to pages edit with the sharedId', () => {
        expect(browserHistory.push).toHaveBeenCalledWith('/settings/pages/edit/newSharedId');
      });
    });
  });

  describe('deletePage', () => {
    it('should delete the page', () => {
      actions.deletePage('data')(dispatch);
      expect(api.delete).toHaveBeenCalledWith('data');
    });

    describe('upon success', () => {
      beforeEach((done) => {
        actions.deletePage('data')(dispatch)
        .then(() => {
          done();
        });
      });

      it('should remove page', () => {
        expect(basicActions.remove).toHaveBeenCalledWith('pages', 'data');
        expect(dispatch).toHaveBeenCalledWith('PAGE REMOVED');
      });
    });
  });
});
