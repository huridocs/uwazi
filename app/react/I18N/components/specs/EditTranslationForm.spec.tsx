/**
 * @jest-environment jsdom
 */
import React from 'react';
import Immutable from 'immutable';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { defaultState, renderConnectedContainer } from 'app/utils/test/renderConnected';
import { IImmutable } from 'shared/types/Immutable';
import { ClientTranslationsSchema } from 'app/istore';
import { actions } from 'app/I18N';
import { EditTranslationsForm } from '../EditTranslationsForm';

describe('EditTranslationForm', () => {
  let translations: IImmutable<ClientTranslationsSchema[]>;

  const render = () => {
    const store = {
      ...defaultState,
      translations,
      settings: {
        collection: Immutable.fromJS({
          languages: [
            { key: 'en', label: 'English' },
            { key: 'es', label: 'Spanish', default: true },
          ],
        }),
      },
    };

    renderConnectedContainer(<EditTranslationsForm context="System" />, () => store);
  };

  beforeEach(() => {
    jest.spyOn(actions, 'saveTranslations').mockImplementation(() => ({ type: 'save' }));

    translations = Immutable.fromJS([
      {
        locale: 'en',
        contexts: [
          {
            id: 'System',
            label: 'User Interface',
            type: 'Uwazi UI',
            values: {
              Library: 'Library',
              Search: 'Search',
              Home: 'Home',
            },
          },
          {
            type: 'Entity',
            label: 'State',
            id: '5bfbb1a0471dd0fc16ada146',
            values: {
              Title: 'Title',
            },
          },
        ],
      },
      {
        locale: 'es',
        contexts: [
          {
            id: 'System',
            label: 'User Interface',
            type: 'Uwazi UI',
            values: {
              Library: 'Biblioteca',
              Search: 'Busqueda',
              Home: 'Principal',
            },
          },
          {
            type: 'Entity',
            label: 'State',
            id: '5bfbb1a0471dd0fc16ada146',
            values: {
              Title: 'Title',
            },
          },
        ],
      },
    ]);
  });

  describe('Render', () => {
    it('should render a form with fields for each value and each language', () => {
      render();
      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('Search')).toBeInTheDocument();
      expect(screen.getByText('Library')).toBeInTheDocument();
    });

    it('should render fields alphabetically', () => {
      render();
      const fields = screen.getAllByRole('heading');
      expect(fields[0].textContent).toBe('Home');
      expect(fields[1].textContent).toBe('Library');
      expect(fields[2].textContent).toBe('Search');
    });

    it('should list the default language first in the group', () => {});

    it('should only show the import translations button for the System context', () => {});
  });

  describe('submit', () => {
    it('should call saveTranslations updating the changed value', async () => {
      render();
      const inputField = screen.getByDisplayValue('Principal');
      const submitButton = screen.getByText('Save').parentElement!;

      fireEvent.change(inputField, {
        target: { value: 'Pagina principal' },
      });

      fireEvent.click(submitButton);

      await waitFor(() =>
        expect(actions.saveTranslations).toHaveBeenCalledWith([
          {
            contexts: [
              {
                id: 'System',
                label: 'User Interface',
                type: 'Uwazi UI',
                values: { Home: 'Home', Library: 'Library', Search: 'Search' },
              },
            ],
            locale: 'en',
          },
          {
            contexts: [
              {
                id: 'System',
                label: 'User Interface',
                type: 'Uwazi UI',
                values: { Home: 'Pagina principal', Library: 'Biblioteca', Search: 'Busqueda' },
              },
            ],
            locale: 'es',
          },
        ])
      );
    });

    it('should display an error when values are empty', () => {});
  });
});
