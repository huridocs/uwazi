/**
 * @jest-environment jsdom
 */
import * as uploadActions from 'app/Uploads/actions/uploadsActions';
import { socket } from '../../socket';
import '../sockets';
import { store } from '../../store';

describe('sockets', () => {
  beforeEach(() => {
    spyOn(store, 'dispatch').and.callFake(argument =>
      typeof argument === 'function' ? argument(store.dispatch) : argument
    );
  });

  describe('disconnect', () => {
    it('should emit a disconnect event', () => {
      jasmine.clock().install();
      socket._callbacks.$disconnect[0]('transport close');
      jasmine.clock().tick(8000);
      expect(store.dispatch.calls.allArgs()[1][0].notification.message).toEqual(
        'Lost connection to the server. Your changes may be lost'
      );
      jasmine.clock().uninstall();
    });
  });

  describe('reconnect', () => {
    it('should emit a connect event', () => {
      jasmine.clock().install();
      socket._callbacks.$disconnect[0]('transport close');
      jasmine.clock().tick(8000);
      socket.io._callbacks.$reconnect[0]();
      jasmine.clock().tick(8000);
      expect(store.dispatch).toHaveBeenCalled();
      expect(store.dispatch.calls.allArgs()[5][0].notification.message).toEqual(
        'Connected to server'
      );
      jasmine.clock().uninstall();
    });

    describe('when reconnect happens just after disconnect event', () => {
      it('should clearTimeout and not dispatch disconnect message', () => {
        jasmine.clock().install();

        socket._callbacks.$disconnect[0]('transport close');
        socket.io._callbacks.$reconnect[0]();
        jasmine.clock().tick(8000);

        expect(store.dispatch).toHaveBeenCalledTimes(0);
      });
    });
  });

  describe('templateChange', () => {
    it('should emit a templateChange event', () => {
      socket._callbacks.$templateChange[0]({ _id: '123' });
      expect(store.dispatch).toHaveBeenCalledWith({
        type: 'templates/UPDATE',
        value: { _id: '123' },
      });
    });
  });

  describe('templateDelete', () => {
    it('should emit a templateDelete event', () => {
      socket._callbacks.$templateDelete[0]({ id: '123' });
      expect(store.dispatch).toHaveBeenCalledWith({
        type: 'templates/REMOVE',
        value: { _id: '123' },
      });
    });
  });

  describe('thesauriChange', () => {
    it('should emit a thesauriChange event', () => {
      socket._callbacks.$thesauriChange[0]({ _id: '123' });
      expect(store.dispatch).toHaveBeenCalledWith({
        type: 'thesauris/UPDATE',
        value: { _id: '123' },
      });
    });
  });

  describe('thesauriDelete', () => {
    it('should emit a thesauriDelete event', () => {
      socket._callbacks.$thesauriDelete[0]({ id: '123' });
      expect(store.dispatch).toHaveBeenCalledWith({
        type: 'thesauris/REMOVE',
        value: { _id: '123' },
      });
    });
  });

  describe('templateChange', () => {
    it('should emit a templateChange event', () => {
      socket._callbacks.$templateChange[0]({ _id: '123' });
      expect(store.dispatch).toHaveBeenCalledWith({
        type: 'templates/UPDATE',
        value: { _id: '123' },
      });
    });
  });

  describe('updateSettings', () => {
    it('should emit a updateSettings event', () => {
      socket._callbacks.$updateSettings[0]({ id: '123' });
      expect(store.dispatch).toHaveBeenCalledWith({
        type: 'settings/collection/SET',
        value: { id: '123' },
      });
    });
  });

  describe('translationsChange', () => {
    it('should emit a translationsChange event', () => {
      socket._callbacks.$translationsChange[0]({ id: '123' });
      expect(store.dispatch).toHaveBeenCalledWith({
        customIndex: 'locale',
        type: 'translations/UPDATE',
        value: { id: '123' },
      });
    });
  });

  describe('translationsInstallDone', () => {
    it('should dispatch a notification', () => {
      socket._callbacks.$translationsInstallDone[0]();
      expect(store.dispatch.calls.allArgs()[1][0]).toEqual({
        type: 'NOTIFY',
        notification: {
          id: expect.any(String),
          message: 'Languages installed successfully',
          type: 'success',
        },
      });
    });
  });

  describe('translationsInstallError', () => {
    it('should dispatch a notification', () => {
      socket._callbacks.$translationsInstallError[0]('error message');
      expect(store.dispatch.calls.allArgs()[1][0]).toEqual({
        type: 'NOTIFY',
        notification: {
          id: expect.any(String),
          message: 'An error happened while installing languages:\nerror message',
          type: 'danger',
        },
      });
    });
  });

  describe('translationsDelete', () => {
    it('should emit a translationsDelete event', () => {
      socket._callbacks.$translationsDelete[0]('localeString');
      expect(store.dispatch).toHaveBeenCalledWith({
        customIndex: 'locale',
        type: 'translations/REMOVE',
        value: { locale: 'localeString' },
      });
    });
  });

  describe('translationsDeleteError', () => {
    it('should dispatch a notification', () => {
      socket._callbacks.$translationsDeleteError[0]('error message');
      expect(store.dispatch.calls.allArgs()[1][0]).toEqual({
        type: 'NOTIFY',
        notification: {
          id: expect.any(String),
          message: 'An error happened while deleting a language:\nerror message',
          type: 'danger',
        },
      });
    });
  });

  describe('translationsDeleteDone', () => {
    it('should dispatch a notification', () => {
      socket._callbacks.$translationsDeleteDone[0]();
      expect(store.dispatch.calls.allArgs()[1][0]).toEqual({
        type: 'NOTIFY',
        notification: {
          id: expect.any(String),
          message: 'Language uninstalled success',
          type: 'success',
        },
      });
    });
  });

  describe('documentProcessed', () => {
    it('should dispatch the documentProcessed action', () => {
      jest.spyOn(uploadActions, 'documentProcessed').mockImplementationOnce(() => {});
      socket._callbacks.$documentProcessed[0]('entitySharedId');
      expect(uploadActions.documentProcessed).toHaveBeenCalledWith('entitySharedId', 'library');
    });
  });
});
