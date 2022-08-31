/**
 * @jest-environment jsdom
 */
import Immutable from 'immutable';
import React from 'react';
import { fireEvent, screen, RenderResult, within, waitFor } from '@testing-library/react';

import { defaultState, renderConnectedContainer } from 'app/utils/test/renderConnected';
import { actions, I18NApi } from 'app/I18N';
import LanguageList from '../LanguageList';

describe('Languages', () => {
  let renderResult: RenderResult;

  const currentLanguages = [
    { label: 'Español', key: 'es', default: true },
    { label: 'English', key: 'en' },
  ];

  const abkhazianLanguage = {
    label: 'Abkhazian',
    key: 'ab',
    ISO639_3: 'abk',
    localized_label: 'Abkhazian',
    translationAvailable: false,
  };

  const availableLanguages = [
    { ...abkhazianLanguage },
    {
      label: 'English',
      key: 'en',
      ISO639_3: 'eng',
      localized_label: 'English',
      translationAvailable: false,
    },
    {
      label: 'Spanish',
      key: 'es',
      ISO639_3: 'spa',
      localized_label: 'Español',
      translationAvailable: true,
    },
    {
      label: 'Afar',
      key: 'aa',
      ISO639_3: 'aar',
      localized_label: 'Afar',
      translationAvailable: false,
    },
    {
      label: 'Thai',
      key: 'th',
      ISO639_3: 'tha',
      localized_label: 'ไทย',
      translationAvailable: true,
    },
  ];

  const confirmAction = () => {
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'CONFIRM' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Accept' }));
  };

  beforeEach(async () => {
    spyOn(I18NApi, 'getLanguages').and.callFake(async () => Promise.resolve(availableLanguages));
    spyOn(actions, 'setDefaultLanguage').and.returnValue({
      type: 'SET_DEFAULT_LANGUAGE',
    });
    spyOn(actions, 'deleteLanguage').and.returnValue({
      type: 'DELETE_LANGUAGE',
    });
    spyOn(actions, 'addLanguage').and.returnValue({
      type: 'ADD_LANGUAGE',
    });
    spyOn(actions, 'resetDefaultTranslations').and.returnValue({
      type: 'ADD_LANGUAGE',
    });
    const reduxStore = {
      ...defaultState,
      settings: {
        collection: Immutable.fromJS({ languages: Immutable.fromJS(currentLanguages) }),
      },
    };
    await waitFor(() => {
      ({ renderResult } = renderConnectedContainer(<LanguageList />, () => reduxStore));
    });
  });

  describe('visibility upon language info', () => {
    it('should hid a delete button for the default language', () => {
      const activeLanguages = renderResult.container.getElementsByClassName(
        'installed-languages'
      )[0] as HTMLElement;
      const spanishLanguage = within(activeLanguages).getByText('Español (es)').parentElement!;
      const deleteButton = within(spanishLanguage).getByRole('button', {
        name: 'Delete language',
      });
      expect(deleteButton.getAttribute('class')).toContain('action-hidden');
    });

    it('should not show reset translation if it is not available', () => {
      const activeLanguages = renderResult.container.getElementsByClassName(
        'installed-languages'
      )[0] as HTMLElement;
      const englishLanguage = within(activeLanguages).getByText('English (en)').parentElement!;
      const resetButton = within(englishLanguage).getByRole('button', {
        name: 'Reset default translation',
      });
      expect(resetButton.getAttribute('class')).toContain('action-hidden');
    });

    it('should show a label when translation is available', () => {
      const activeLanguages = renderResult.container.getElementsByClassName(
        'available-languages'
      )[0] as HTMLElement;
      const thaiLanguage = within(activeLanguages).getByText('Thai (th)').parentElement!;
      const availablilityThaiLabel = within(thaiLanguage).queryByText(
        'Available default translation'
      );
      expect(availablilityThaiLabel).toBeInTheDocument();

      const afarLanguage = within(activeLanguages).getByText('Afar (aa)').parentElement!;
      const availablilityAfarLabel = within(afarLanguage).queryByText(
        'Available default translation'
      );
      expect(availablilityAfarLabel).not.toBeInTheDocument();
    });
  });

  describe('clicking on Set as default', () => {
    it('should call setDefaultLanguage', async () => {
      const activeLanguages = renderResult.container.getElementsByClassName(
        'installed-languages'
      )[0] as HTMLElement;
      const englishLanguage = within(activeLanguages).getByText('English (en)').parentElement!;
      const englishAsDefaultButton = within(englishLanguage).getByRole('button', {
        name: 'Set as default',
      });
      fireEvent.click(englishAsDefaultButton);
      expect(actions.setDefaultLanguage).toHaveBeenCalledWith('en');
    });
  });

  describe('clicking on Delete Language', () => {
    beforeEach(() => {
      const activeLanguages = renderResult.container.getElementsByClassName(
        'installed-languages'
      )[0] as HTMLElement;
      const englishLanguage = within(activeLanguages).getByText('English (en)').parentElement!;
      const deleteEnglishButton = within(englishLanguage).getByRole('button', {
        name: 'Delete language',
      });
      fireEvent.click(deleteEnglishButton);
    });

    it('should call delete languae', () => {
      expect(screen.queryByText('Are you sure you want to delete')).toBeInTheDocument();
      confirmAction();
      expect(actions.deleteLanguage).toHaveBeenCalledWith('en');
    });

    it('should close the modal and do nothing at canceling', () => {
      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
      expect(screen.queryByText('Are you sure you want to delete')).not.toBeInTheDocument();
      expect(actions.deleteLanguage).not.toHaveBeenCalled();
    });
  });

  describe('clicking on Add Language', () => {
    beforeEach(() => {
      const activeLanguages = renderResult.container.getElementsByClassName(
        'available-languages'
      )[0] as HTMLElement;
      const newLanguage = within(activeLanguages).getByText('Abkhazian (ab)').parentElement!;
      const addLanguageButton = within(newLanguage).getByRole('button', { name: 'Add language' });
      fireEvent.click(addLanguageButton);
    });

    it('should call add language at accepting', () => {
      expect(screen.queryByText('Confirm add')).toBeInTheDocument();
      confirmAction();
      expect(actions.addLanguage).toHaveBeenCalledWith(abkhazianLanguage);
    });

    it('should close the modal and do nothing at canceling', () => {
      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
      expect(screen.queryByText('Confirm add')).not.toBeInTheDocument();
      expect(actions.addLanguage).not.toHaveBeenCalled();
    });
  });

  describe('clicking on Reset default translation', () => {
    beforeEach(() => {
      const activeLanguages = renderResult.container.getElementsByClassName(
        'installed-languages'
      )[0] as HTMLElement;
      const newLanguage = within(activeLanguages).getByText('Español (es)').parentElement!;
      const resetTranslationButton = within(newLanguage).getByRole('button', {
        name: 'Reset default translation',
      });
      fireEvent.click(resetTranslationButton);
    });
    it('should call reset default translation at accepting', () => {
      expect(screen.queryByText('Confirm reset translation')).toBeInTheDocument();
      confirmAction();
      expect(actions.resetDefaultTranslations).toHaveBeenCalledWith('es');
    });

    it('should close the modal and do nothing at canceling', () => {
      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
      expect(screen.queryByText('Confirm reset translation')).not.toBeInTheDocument();
      expect(actions.resetDefaultTranslations).not.toHaveBeenCalled();
    });
  });
});
