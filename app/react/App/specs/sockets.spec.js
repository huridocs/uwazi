/**
 * @jest-environment jsdom
 */

import { getStore } from '#shared/atomStore/index.js';
import * as uploadActions from '#app/Uploads/actions/uploadsActions.js';
import { mergeClientSettings } from '#V2/atoms/mergeClientSettings.js';
import { settingsAtom, templatesAtom, thesauriAtom, translationsAtom } from '#V2/atoms/index.js';
import { socket } from '../../socket.js';
import '../sockets.js';
import { store } from '../../store.js';
import {
  currentTranslations,
  newLanguage,
  updatedTranslation,
  translationKeysChangeArguments,
  translationKeysChangeResult,
  templates,
  thesauri,
} from './fixtures/fixtures.js';

const getDispatchCalls = () => store.dispatch.mock?.calls ?? store.dispatch.calls?.allArgs() ?? [];

const findNotifyByMessage = message => {
  const calls = getDispatchCalls();
  const action = calls
    .map(args => args[0])
    .find(a => a?.type === 'NOTIFY' && a?.notification?.message === message);
  return action;
};

describe('sockets', () => {
  const atomStore = getStore();

  describe('connection events', () => {
    beforeEach(() => {
      jest
        .spyOn(store, 'dispatch')
        .mockImplementation(argument =>
          typeof argument === 'function' ? argument(store.dispatch) : argument
        );
    });

    it('should emit a disconnect event', () => {
      jasmine.clock().install();
      socket._callbacks.$disconnect[0]('transport close');
      jasmine.clock().tick(8000);
      const lostAction = findNotifyByMessage(
        'Lost connection to the server. Your changes may be lost'
      );
      expect(lostAction?.notification?.message).toEqual(
        'Lost connection to the server. Your changes may be lost'
      );
      jasmine.clock().uninstall();
    });

    it('should emit a connect event', () => {
      jasmine.clock().install();
      socket._callbacks.$disconnect[0]('transport close');
      jasmine.clock().tick(8000);
      socket.io._callbacks.$reconnect[0]();
      jasmine.clock().tick(8000);
      expect(store.dispatch).toHaveBeenCalled();
      expect(findNotifyByMessage('Connected to server')?.notification?.message).toEqual(
        'Connected to server'
      );
      jasmine.clock().uninstall();
    });

    describe('when reconnect happens just after disconnect event', () => {
      it('should run reconnect handler and dispatch Connected to server', () => {
        jasmine.clock().install();
        socket._callbacks.$disconnect[0]('transport close');
        socket.io._callbacks.$reconnect[0]();
        jasmine.clock().tick(8000);

        expect(findNotifyByMessage('Connected to server')).toBeDefined();
        jasmine.clock().uninstall();
      });
    });
  });

  describe('Templates', () => {
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
        templatesAtom,
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
        templatesAtom,
        expect.arrayContaining([...templates, newTemplate])
      );
    });

    it('should emit a templateDelete event and remove that template from the store', () => {
      socket._callbacks.$templateDelete[0]({ _id: '1' });
      expect(atomStore.set).toHaveBeenCalledWith(
        templatesAtom,
        expect.arrayContaining([templates[1], templates[2]])
      );
      expect(atomStore.set).toHaveBeenCalledWith(
        templatesAtom,
        expect.not.arrayContaining([templates[0]])
      );
    });
  });

  describe('Thesauri', () => {
    beforeEach(() => {
      atomStore.set(
        thesauriAtom,
        thesauri.map(t => ({ ...t }))
      );
      spyOn(atomStore, 'set');
      spyOn(store, 'dispatch').and.callFake(argument =>
        typeof argument === 'function' ? argument(store.dispatch) : argument
      );
    });

    it('should emit a thesauriChange event and update the stores', () => {
      const updatedThesaurus = {
        ...thesauri[0],
        name: 'Updated categories',
        values: [
          ...thesauri[0].values,

          {
            id: 'cat3',
            label: 'Category 3',
            values: 'cat3',
          },
        ],
      };

      socket._callbacks.$thesauriChange[0](updatedThesaurus);

      expect(store.dispatch).toHaveBeenCalledWith({
        type: 'thesauris/UPDATE',
        value: updatedThesaurus,
      });
      expect(atomStore.set).toHaveBeenCalledWith(
        thesauriAtom,
        expect.arrayContaining([updatedThesaurus, thesauri[1]])
      );
    });

    it('should emit a thesauriChange event and add the thesaurus to the store', () => {
      const newThesaurus = {
        _id: 'new',
        name: 'New!',
        values: [],
      };

      socket._callbacks.$thesauriChange[0](newThesaurus);

      expect(atomStore.set).toHaveBeenCalledWith(
        thesauriAtom,
        expect.arrayContaining([...thesauri, newThesaurus])
      );
    });

    it('should emit a thesauriDelete event and remove the thesaurus from the store', () => {
      socket._callbacks.$thesauriDelete[0]({ _id: 'thesaurus2' });
      expect(atomStore.set).toHaveBeenCalledWith(
        thesauriAtom,
        expect.arrayContaining([thesauri[0]])
      );
      expect(atomStore.set).toHaveBeenCalledWith(
        thesauriAtom,
        expect.not.arrayContaining([thesauri[1]])
      );
    });
  });

  describe('Collection settings', () => {
    beforeEach(() => {
      atomStore.set(settingsAtom, { key: 'value' });
      spyOn(atomStore, 'set');
    });

    it('should emit a updateSettings event and update the store', () => {
      const incoming = { payload: 'new settings' };
      socket._callbacks.$updateSettings[0](incoming);
      expect(atomStore.set).toHaveBeenCalledWith(settingsAtom, expect.any(Function));
      const setCall = atomStore.set.mock.calls.find(
        call => call[0] === settingsAtom && typeof call[1] === 'function'
      );
      expect(setCall).toBeDefined();
      const updater = setCall[1];
      const prev = { key: 'value' };
      expect(updater(prev)).toEqual(mergeClientSettings(prev, incoming));
    });
  });

  describe('Translations', () => {
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
          translationsAtom,
          expect.arrayContaining([updatedTranslation, currentTranslations[1]])
        );
      });

      it('should add a new language to the translations', () => {
        socket._callbacks.$translationsChange[0](newLanguage);
        expect(atomStore.set).toHaveBeenCalledWith(
          translationsAtom,
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
        expect(atomStore.set).toHaveBeenCalledWith(translationsAtom, translationKeysChangeResult);
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

      it('should emit a translationsDelete event when a language is removed and update the store', () => {
        socket._callbacks.$translationsDelete[0]('es');
        expect(atomStore.set).toHaveBeenCalledWith(translationsAtom, [currentTranslations[0]]);
      });
    });
  });

  describe('Languages', () => {
    beforeEach(() => {
      jest
        .spyOn(store, 'dispatch')
        .mockImplementation(argument =>
          typeof argument === 'function' ? argument(store.dispatch) : argument
        );
    });

    describe('language install', () => {
      it('should dispatch a notification on translationsInstallDone', () => {
        socket._callbacks.$translationsInstallDone[0]();
        const action = findNotifyByMessage('Languages installed successfully');
        expect(action).toMatchObject({
          type: 'NOTIFY',
          notification: {
            message: 'Languages installed successfully',
            type: 'success',
          },
        });
        expect(action.notification.id).toBeDefined();
      });

      it('should dispatch a notification on translationsInstallError', () => {
        socket._callbacks.$translationsInstallError[0]('error message');
        const action = findNotifyByMessage(
          'An error has occured while installing languages:\nerror message'
        );
        expect(action).toMatchObject({
          type: 'NOTIFY',
          notification: {
            message: 'An error has occured while installing languages:\nerror message',
            type: 'danger',
          },
        });
        expect(action.notification.id).toBeDefined();
      });
    });

    describe('language delete', () => {
      it('should dispatch a on translationsDeleteDone', () => {
        socket._callbacks.$translationsDeleteDone[0]();
        const action = findNotifyByMessage('Language uninstalled successfully');
        expect(action).toMatchObject({
          type: 'NOTIFY',
          notification: {
            message: 'Language uninstalled successfully',
            type: 'success',
          },
        });
        expect(action.notification.id).toBeDefined();
      });

      it('should dispatch a notification on error', () => {
        socket._callbacks.$translationsDeleteError[0]('error message');
        const action = findNotifyByMessage(
          'An error has occured while deleting a language:\nerror message'
        );
        expect(action).toMatchObject({
          type: 'NOTIFY',
          notification: {
            message: 'An error has occured while deleting a language:\nerror message',
            type: 'danger',
          },
        });
        expect(action.notification.id).toBeDefined();
      });
    });
  });

  describe('conversionFailed', () => {
    beforeEach(() => {
      spyOn(store, 'dispatch').and.callFake(argument =>
        typeof argument === 'function' ? argument(store.dispatch) : argument
      );
    });

    it('should dispatch the documentProcessed action', () => {
      jest.spyOn(uploadActions, 'documentProcessed').mockImplementationOnce(() => {});
      socket._callbacks.$conversionFailed[0]('entitySharedId');
      expect(uploadActions.documentProcessed).toHaveBeenCalledWith('entitySharedId', 'library');
    });
  });

  describe('documentProcessed', () => {
    beforeEach(() => {
      spyOn(store, 'dispatch').and.callFake(argument =>
        typeof argument === 'function' ? argument(store.dispatch) : argument
      );
    });

    it('should dispatch the documentProcessed action', () => {
      jest.spyOn(uploadActions, 'documentProcessed').mockImplementationOnce(() => {});
      socket._callbacks.$documentProcessed[0]('entitySharedId');
      expect(uploadActions.documentProcessed).toHaveBeenCalledWith('entitySharedId', 'library');
    });
  });

  describe('IMPORT_CSV_ROW_EXCEPTIONS', () => {
    beforeEach(() => {
      spyOn(store, 'dispatch').and.callFake(argument =>
        typeof argument === 'function' ? argument(store.dispatch) : argument
      );
    });

    it('should dispatch importRowExceptions action', () => {
      const exceptions = {
        'Sanitized entries skipped in import': [
          {
            index: 0,
            property: 'select_with_spaces',
            reason: '',
            value: ' Item2 ',
          },
        ],
        'Another warning type': [
          {
            index: 1,
            property: 'another_property',
            reason: 'Invalid format',
            value: 'invalid_value',
          },
        ],
      };
      socket._callbacks.$IMPORT_CSV_ROW_EXCEPTIONS[0](exceptions);
      expect(store.dispatch).toHaveBeenCalledWith({
        type: 'importRowExceptions/SET',
        value: exceptions,
      });
    });
  });
});
