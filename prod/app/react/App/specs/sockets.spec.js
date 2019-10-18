"use strict";var _socket = _interopRequireDefault(require("../../socket"));
require("../sockets");
var _store = require("../../store");function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('sockets', () => {
  beforeEach(() => {
    spyOn(_store.store, 'dispatch').and.callFake(argument => typeof argument === 'function' ? argument(_store.store.dispatch) : argument);
  });

  describe('disconnect', () => {
    it('should emit a disconnect event', () => {
      jasmine.clock().install();
      _socket.default._callbacks.$disconnect[0]('transport close');
      jasmine.clock().tick(8000);
      expect(_store.store.dispatch.calls.allArgs()[1][0].notification.message).toEqual('Lost connection to the server, your changes may be lost');
      jasmine.clock().uninstall();
    });
  });

  describe('reconnect', () => {
    it('should emit a connect event', () => {
      jasmine.clock().install();
      _socket.default._callbacks.$disconnect[0]('transport close');
      jasmine.clock().tick(8000);
      _socket.default._callbacks.$reconnect[0]();
      jasmine.clock().tick(8000);
      expect(_store.store.dispatch).toHaveBeenCalled();
      expect(_store.store.dispatch.calls.allArgs()[5][0].notification.message).toEqual('Connected to server');
      jasmine.clock().uninstall();
    });

    describe('when reconnect happens just after disconnect event', () => {
      it('should clearTimeout and not dispatch disconnect message', () => {
        jasmine.clock().install();

        _socket.default._callbacks.$disconnect[0]('transport close');
        _socket.default._callbacks.$reconnect[0]();
        jasmine.clock().tick(8000);

        expect(_store.store.dispatch).toHaveBeenCalledTimes(0);
      });
    });
  });

  describe('templateChange', () => {
    it('should emit a templateChange event', () => {
      _socket.default._callbacks.$templateChange[0]({ _id: '123' });
      expect(_store.store.dispatch).toHaveBeenCalledWith({ type: 'templates/UPDATE', value: { _id: '123' } });
    });
  });

  describe('templateDelete', () => {
    it('should emit a templateDelete event', () => {
      _socket.default._callbacks.$templateDelete[0]({ id: '123' });
      expect(_store.store.dispatch).toHaveBeenCalledWith({ type: 'templates/REMOVE', value: { _id: '123' } });
    });
  });

  describe('thesauriChange', () => {
    it('should emit a thesauriChange event', () => {
      _socket.default._callbacks.$thesauriChange[0]({ _id: '123' });
      expect(_store.store.dispatch).toHaveBeenCalledWith({ type: 'thesauris/UPDATE', value: { _id: '123' } });
    });
  });

  describe('thesauriDelete', () => {
    it('should emit a thesauriDelete event', () => {
      _socket.default._callbacks.$thesauriDelete[0]({ id: '123' });
      expect(_store.store.dispatch).toHaveBeenCalledWith({ type: 'thesauris/REMOVE', value: { _id: '123' } });
    });
  });

  describe('templateChange', () => {
    it('should emit a templateChange event', () => {
      _socket.default._callbacks.$templateChange[0]({ _id: '123' });
      expect(_store.store.dispatch).toHaveBeenCalledWith({ type: 'templates/UPDATE', value: { _id: '123' } });
    });
  });

  describe('updateSettings', () => {
    it('should emit a updateSettings event', () => {
      _socket.default._callbacks.$updateSettings[0]({ id: '123' });
      expect(_store.store.dispatch).toHaveBeenCalledWith({ type: 'settings/collection/SET', value: { id: '123' } });
    });
  });

  describe('translationsChange', () => {
    it('should emit a translationsChange event', () => {
      _socket.default._callbacks.$translationsChange[0]({ id: '123' });
      expect(_store.store.dispatch).toHaveBeenCalledWith({ type: 'translations/UPDATE', value: { id: '123' } });
    });
  });
});