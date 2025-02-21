/**
 * @jest-environment jsdom
 */
import React from 'react';
import { Provider } from 'jotai';
import { act, render, RenderResult } from '@testing-library/react';
import { localeAtom, translationsAtom, atomStore } from 'V2/atoms';
import { socket } from 'app/socket';
import 'app/App/sockets';
import { t } from '../translateFunction';
import { translations } from './fixtures';

describe('t function', () => {
  let renderResult: RenderResult;
  let locale = 'es';

  const renderEnvironment = (...args: typeof t.arguments) => {
    renderResult = render(<Provider store={atomStore}>{t(...args)}</Provider>);
  };

  beforeEach(() => {
    atomStore.set(translationsAtom, translations);
    atomStore.set(localeAtom, locale);
    locale = 'es';
  });

  it('should return the translation component with the translated text and not subscribe to the store', () => {
    renderEnvironment(
      'System',
      'confirmDeleteDocument',
      'Are you sure you want to delete this document?'
    );
    expect(
      renderResult.getByText('¿Esta seguro que quiere borrar este documento?')
    ).toBeInTheDocument();
  });

  describe('no component', () => {
    it('should return the translated string', () => {
      renderEnvironment(
        'System',
        'confirmDeleteDocument',
        'Are you sure you want to delete this document?',
        false
      );
      expect(
        renderResult.getByText('¿Esta seguro que quiere borrar este documento?')
      ).toBeInTheDocument();
    });

    it('should update translation when the atom is updated partially from the socket', async () => {
      const result = render(
        <Provider store={atomStore}>
          {t(
            'System',
            'confirmDeleteDocument',
            'Are you sure you want to delete this document?',
            true
          )}
        </Provider>
      );

      expect(
        result.getByText('¿Esta seguro que quiere borrar este documento?')
      ).toBeInTheDocument();

      const translation = {
        locale: 'es',
        contexts: [
          {
            id: 'System',
            label: 'System',
            values: {
              Search: 'Buscar',
              confirmDeleteDocument: '¿CONFIRMA ELIMINACION?',
            },
          },
        ],
      };

      await act(async () => {
        //@ts-ignore accessing internal _callbacks for testing purposes
        socket._callbacks.$translationsChange[0](translation);
      });

      await act(async () => {
        expect(result.getByText('¿CONFIRMA ELIMINACION?')).toBeInTheDocument();
      });
    });

    it('should update translation when the atom is updated fully from the socket', async () => {
      const result = render(
        <Provider store={atomStore}> {t('System', 'Search', 'Search', true)}</Provider>
      );

      expect(result.getByText('Buscar')).toBeInTheDocument();

      const translationKeysChangeArguments = [
        {
          language: 'es',
          value: 'Busqueda',
          key: 'Search',
          context: {
            id: 'System',
            label: 'System',
          },
        },
      ];

      await act(async () => {
        //@ts-ignore accessing internal _callbacks for testing purposes
        socket._callbacks.$translationKeysChange[0](translationKeysChangeArguments);
      });

      await act(async () => {
        expect(result.getByText('Busqueda')).toBeInTheDocument();
      });
    });
  });

  describe('when there is no translation', () => {
    it('should return the default text', () => {
      renderEnvironment(
        'System',
        'confirmDeleteEntity',
        'Are you sure you want to delete this entity?',
        false
      );
      expect(
        renderResult.getByText('Are you sure you want to delete this entity?')
      ).toBeInTheDocument();
    });
  });

  describe('only passing context and key', () => {
    it('should use it as default text', () => {
      renderEnvironment('System', 'not translated', undefined, false);
      expect(renderResult.getByText('not translated')).toBeInTheDocument();
    });
  });

  describe('when no context', () => {
    it('should throw an error', () => {
      spyOn(console, 'warn');
      renderEnvironment(
        undefined,
        'confirmDeleteEntity',
        'Are you sure you want to delete this entity?',
        false
      );
      //eslint-disable-next-line no-console
      expect(console.warn).toHaveBeenCalled();
    });
  });
});
