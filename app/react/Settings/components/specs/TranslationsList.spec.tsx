/**
 * @jest-environment jsdom
 */
import React from 'react';
import Immutable from 'immutable';

import { fireEvent, screen, within } from '@testing-library/react';
import { defaultState, renderConnectedContainer } from 'app/utils/test/renderConnected';
import { I18NLink } from 'app/I18N/components/I18NLink';
import TranslationsList from '../TranslationsList';

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
    it('should edit a translation context from translate link', async () => {
      spyOn(I18NLink, 'navigate');
      render();
      const [systemUI] = screen.getAllByRole('listitem');
      fireEvent.click(within(systemUI).getByText('Translate'));
      expect(I18NLink.navigate).toHaveBeenCalledWith('/en/settings/translations/edit/1');
    });

    it('should edit a translation context from context name', async () => {
      spyOn(I18NLink, 'navigate');
      render();
      const [, systemUI] = screen.getAllByRole('listitem');
      fireEvent.click(within(systemUI).getByText('System UI'));
      expect(I18NLink.navigate).toHaveBeenCalledWith('/en/settings/translations/edit/3');
    });
  });
});
