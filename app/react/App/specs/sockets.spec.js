/**
 * @jest-environment jsdom
 */
/* eslint-disable max-statements */
import * as uploadActions from 'app/Uploads/actions/uploadsActions';
import { atomStore, templatesAtom, translationsAtom } from 'V2/atoms';
import { socket } from '../../socket';
import '../sockets';
import { store } from '../../store';
import {
  currentTranslations,
  newLanguage,
  updatedTranslation,
  translationKeysChangeArguments,
  translationKeysChangeResult,
  templates,
} from './fixtures/fixtures';

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

  describe('templates', () => {
    beforeEach(() => {
      atomStore.set(
        templatesAtom,
        templates.map(t => ({ ...t }))
      );
      spyOn(atomStore, 'set');
    });

    it('should emit a templateChange event and update the store', () => {
      socket._callbacks.$templateChange[0]({ ...templates[1], name: 'Template 2 updated' });
      expect(atomStore.set).toHaveBeenCalledWith(
        expect.any(Object),
        expect.arrayContaining([
          templates[0],
          { ...templates[1], name: 'Template 2 updated' },
          templates[2],
        ])
      );
    });

    it('should emit a templateChange event and add the template to the store', () => {
      const newTemplate = {
        _id: '4',
        name: 'Template 4',
        commonProperties: [
          {
            _id: '41',
            label: 'Title',
            name: 'title',
            type: 'text',
            isCommonProperty: true,
          },
        ],
        properties: [],
      };

      socket._callbacks.$templateChange[0](newTemplate);
      expect(atomStore.set).toHaveBeenCalledWith(
        expect.any(Object),
        expect.arrayContaining([...templates, newTemplate])
      );
    });

    it('should emit a templateDelete event and remove that template from the store', () => {
      socket._callbacks.$templateDelete[0]({ _id: '1' });
      expect(atomStore.set).toHaveBeenCalledWith(
        expect.any(Object),
        expect.arrayContaining([templates[1], templates[2]])
      );
      expect(atomStore.set).toHaveBeenCalledWith(
        expect.any(Object),
        expect.not.arrayContaining([templates[0]])
      );
    });
  });

  describe('Thesauri', () => {
    it('should emit a thesauriChange event', () => {
      socket._callbacks.$thesauriChange[0]({ _id: '123' });
      expect(store.dispatch).toHaveBeenCalledWith({
        type: 'thesauris/UPDATE',
        value: { _id: '123' },
      });
    });

    it('should emit a thesauriDelete event', () => {
      socket._callbacks.$thesauriDelete[0]({ id: '123' });
      expect(store.dispatch).toHaveBeenCalledWith({
        type: 'thesauris/REMOVE',
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
    beforeEach(() => {
      atomStore.set(
        translationsAtom,
        currentTranslations.map(t => ({ ...t }))
      );
      spyOn(atomStore, 'set');
    });

    it('should emit a translationsChange event', () => {
      socket._callbacks.$translationsChange[0](updatedTranslation);
      expect(atomStore.set).toHaveBeenCalledWith(
        expect.any(Object),
        expect.arrayContaining([updatedTranslation, currentTranslations[1]])
      );
    });

    it('should add a new language to the translations', () => {
      socket._callbacks.$translationsChange[0](newLanguage);
      expect(atomStore.set).toHaveBeenCalledWith(
        expect.any(Object),
        expect.arrayContaining([...currentTranslations, newLanguage])
      );
    });
  });

  describe('translationKeysChange', () => {
    const initialTranslations = [...currentTranslations.map(t => ({ ...t })), newLanguage];

    beforeEach(() => {
      atomStore.set(translationsAtom, initialTranslations);
      spyOn(atomStore, 'set');
    });

    it('should emit a translationKeysChange event', () => {
      socket._callbacks.$translationKeysChange[0](translationKeysChangeArguments);
      expect(atomStore.set).toHaveBeenCalledWith(expect.any(Object), translationKeysChangeResult);
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
          message: 'An error has occured while installing languages:\nerror message',
          type: 'danger',
        },
      });
    });
  });

  describe('translationsDelete', () => {
    beforeEach(() => {
      atomStore.set(
        translationsAtom,
        currentTranslations.map(t => ({ ...t }))
      );
      spyOn(atomStore, 'set');
    });

    it('should emit a translationsDelete event', () => {
      socket._callbacks.$translationsDelete[0]('es');
      expect(atomStore.set).toHaveBeenCalledWith(expect.any(Object), [currentTranslations[0]]);
    });
  });

  describe('translationsDeleteError', () => {
    it('should dispatch a notification', () => {
      socket._callbacks.$translationsDeleteError[0]('error message');
      expect(store.dispatch.calls.allArgs()[1][0]).toEqual({
        type: 'NOTIFY',
        notification: {
          id: expect.any(String),
          message: 'An error has occured while deleting a language:\nerror message',
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
          message: 'Language uninstalled successfully',
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
