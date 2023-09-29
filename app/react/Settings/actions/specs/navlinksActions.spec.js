import { actions as formActions } from 'react-redux-form';
import { RequestParams } from 'app/utils/RequestParams';

import { actions as basicActions } from 'app/BasicReducer';
import { mockID } from 'shared/uniqueID';

import { notificationActions } from 'app/Notifications';

import api from 'app/Settings/SettingsAPI';
import * as uiActions from 'app/Settings/actions/uiActions';

import * as actions from '../navlinksActions';

describe('Settings/Navlinks actions', () => {
  let dispatch;

  beforeEach(() => {
    mockID();
    dispatch = jasmine.createSpy('dispatch');
    spyOn(api, 'save').and.callFake(async () => Promise.resolve({ _id: 'newId', _rev: 'newRev' }));
    spyOn(formActions, 'load').and.returnValue('ITEMS LOADED');
    spyOn(uiActions, 'editLink').and.returnValue('ITEM EDITED');
    spyOn(formActions, 'push').and.returnValue('ITEM PUSHED');
    spyOn(formActions, 'move').and.returnValue('ITEMS REORDERED');
    spyOn(formActions, 'remove').and.returnValue('ITEM REMOVED');
    spyOn(basicActions, 'set').and.returnValue('DATA SET');
    spyOn(notificationActions, 'notify').and.returnValue('NOTIFIED');
  });

  describe('loadLinks', () => {
    it('should load sent links into navlinksData', () => {
      expect(actions.loadLinks('links')).toBe('ITEMS LOADED');
      expect(formActions.load).toHaveBeenCalledWith('settings.navlinksData', { links: 'links' });
    });
  });

  describe('addLink', () => {
    it('should push a new item with default naming', () => {
      const expected = { title: 'Item 2', id: 'unique_id', type: 'link', sublinks: [] };
      actions.addLink([{ _id: 'existing link' }])(dispatch);
      expect(formActions.push).toHaveBeenCalledWith('settings.navlinksData.links', expected);
      expect(uiActions.editLink).toHaveBeenCalledWith('unique_id');
    });
  });

  describe('sortLink', () => {
    it('should reorder links', () => {
      expect(actions.sortLink({}, 3, 2)).toBe('ITEMS REORDERED');
      expect(formActions.move).toHaveBeenCalledWith('settings.navlinksData.links', 3, 2);
    });
  });

  describe('removeLink', () => {
    it('should remove an existing item from the links', () => {
      expect(actions.removeLink(3)).toBe('ITEM REMOVED');
      expect(formActions.remove).toHaveBeenCalledWith('settings.navlinksData.links', 3);
    });
  });

  describe('saveLinks', () => {
    it('should dispatch a SAVING_NAVLINKS and save the data', () => {
      actions.saveLinks('data')(dispatch);
      expect(dispatch.calls.count()).toBe(1);
      expect(dispatch).toHaveBeenCalledWith({ type: 'SAVING_NAVLINKS' });
      expect(api.save).toHaveBeenCalledWith(new RequestParams('data'));
    });

    describe('on error', () => {
      it('should dispatch NAVLINKS_SAVED', async () => {
        api.save.and.callFake(() => Promise.reject(new Error()));
        await actions.saveLinks('data')(dispatch);
        expect(dispatch).toHaveBeenCalledWith({ type: 'NAVLINKS_SAVED', data: 'data' });
      });
    });

    describe('upon success', () => {
      beforeEach(done => {
        actions
          .saveLinks('data')(dispatch)
          .then(() => {
            done();
          });
      });

      it('should dispatch a NAVLINKS_SAVED with response', () => {
        expect(dispatch).toHaveBeenCalledWith({
          type: 'NAVLINKS_SAVED',
          data: { _id: 'newId', _rev: 'newRev' },
        });
      });

      it('should set settings/collection to response', () => {
        expect(basicActions.set).toHaveBeenCalledWith('settings/collection', {
          _id: 'newId',
          _rev: 'newRev',
        });
        expect(dispatch).toHaveBeenCalledWith('DATA SET');
      });

      it('should notify saved successfully', () => {
        expect(notificationActions.notify).toHaveBeenCalledWith('Saved successfully.', 'success');
        expect(dispatch).toHaveBeenCalledWith('NOTIFIED');
      });
    });
  });
});
