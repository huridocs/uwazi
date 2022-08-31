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
    it('should call delete languae', () => {
      const activeLanguages = renderResult.container.getElementsByClassName(
        'installed-languages'
      )[0] as HTMLElement;
      const englishLanguage = within(activeLanguages).getByText('English (en)').parentElement!;
      const deleteEnglishButton = within(englishLanguage).getByRole('button', {
        name: 'Delete language',
      });
      fireEvent.click(deleteEnglishButton);
      expect(screen.queryByText('Are you sure you want to delete')).toBeInTheDocument();
      confirmAction();
      expect(actions.deleteLanguage).toHaveBeenCalledWith('en');
    });
  });

  describe('clicking on Add Language', () => {
    it('should call add language', () => {
      const activeLanguages = renderResult.container.getElementsByClassName(
        'available-languages'
      )[0] as HTMLElement;
      const newLanguage = within(activeLanguages).getByText('Abkhazian (ab)').parentElement!;
      const addLanguageButton = within(newLanguage).getByRole('button', { name: 'Add language' });
      fireEvent.click(addLanguageButton);
      expect(screen.queryByText('Confirm add')).toBeInTheDocument();
      confirmAction();
      expect(actions.addLanguage).toHaveBeenCalledWith(abkhazianLanguage);
    });
  });
});
