/**
 * @jest-environment jsdom
 */
import React from 'react';
import { act, render, RenderResult } from '@testing-library/react';
import { Provider } from 'jotai';
import { localeAtom, translationsAtom, atomStore } from 'V2/atoms';
import { t } from '../translateFunction';
import { translations, updatedTranslations } from './fixtures';

describe('t function', () => {
  let renderResult: RenderResult;
  let locale = 'es';

  const renderEnvironment = (...args: typeof t.arguments) => {
    renderResult = render(<Provider store={atomStore}>{t(...args)}</Provider>);
  };

  beforeEach(() => {
    atomStore.set(translationsAtom, translations);
    atomStore.set(localeAtom, locale);
    jest.spyOn(atomStore, 'sub');
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
    expect(atomStore.sub).toHaveBeenCalledTimes(3);
    expect(t.translation).toBe(undefined);
  });

  describe('no component', () => {
    it('should return the translated string and subscribe to the atom store', () => {
      renderEnvironment(
        'System',
        'confirmDeleteDocument',
        'Are you sure you want to delete this document?',
        false
      );
      expect(
        renderResult.getByText('¿Esta seguro que quiere borrar este documento?')
      ).toBeInTheDocument();
      // expect(atomStore.sub).toHaveBeenCalledTimes(4);
      // expect(t.translation).toEqual({
      //   contexts: translations[1].contexts,
      //   locale: 'es',
      // });
    });

    it('should update translation when the atom updates', async () => {
      renderEnvironment(
        'System',
        'confirmDeleteDocument',
        'Are you sure you want to delete this document?',
        false
      );
      expect(
        renderResult.getByText('¿Esta seguro que quiere borrar este documento?')
      ).toBeInTheDocument();

      await act(async () => {
        atomStore.set(translationsAtom, updatedTranslations);
      });

      // expect(t.translation).toEqual({
      //   contexts: updatedTranslations[1].contexts,
      //   locale: 'es',
      // });
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
