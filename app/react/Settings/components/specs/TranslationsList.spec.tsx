/**
 * @jest-environment jsdom
 */
import React from 'react';
import Immutable from 'immutable';

import { fireEvent, screen, within } from '@testing-library/react';
import { defaultState, renderConnectedContainer } from 'app/utils/test/renderConnected';
import TranslationsList from '../TranslationsList';

const mockedUseNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...(jest.requireActual('react-router-dom') as any),
  useNavigate: () => mockedUseNavigate,
}));

describe('TranslationsList', () => {
  const render = () => {
    const state = {
      ...defaultState,
      translations: Immutable.fromJS([
        {
          locale: 'es',
          contexts: [
            {
              _id: '1',
              id: '1',
              label: 'Menu',
              type: 'Uwazi UI',
            },
            { _id: '2', id: '2', label: 'Thesaurus 1' },
            { _id: '3', id: '3', label: 'System UI', type: 'Uwazi UI' },
          ],
        },
      ]),
      settings: { collection: Immutable.fromJS({ languages: [{ key: 'es', default: true }] }) },
    };
    renderConnectedContainer(<TranslationsList />, () => state);
  };

  describe('render', () => {
    it('should a list of the different translations contexts', () => {
      render();
      const contexts = screen.getAllByRole('list');
      expect(screen.getAllByRole('heading').map(h => h.textContent)).toEqual([
        'System translations',
        'Content translations',
      ]);
      const systemTranslations = within(contexts[0])
        .getAllByRole('listitem')
        .map(li => li.textContent);

      expect(systemTranslations).toEqual(['Uwazi UIMenu Translate', 'Uwazi UISystem UI Translate']);

      const contentTranslastions = within(contexts[1])
        .getAllByRole('listitem')
        .map(li => li.textContent);

      expect(contentTranslastions).toEqual(['Thesaurus 1 Translate']);
    });
  });

  describe('Translation links', () => {
    it.each`
      index | text           | linkAddress
      ${0}  | ${'Translate'} | ${'/en/settings/translations/edit/1'}
      ${1}  | ${'System UI'} | ${'/en/settings/translations/edit/3'}
    `('should edit a translation context from $text', async ({ index, text, linkAddress }) => {
      render();
      const list = screen.getAllByRole('listitem')[index];
      fireEvent.click(within(list).getByText(text).parentElement!);
      expect(mockedUseNavigate).toHaveBeenCalledWith(linkAddress);
    });
  });
});
