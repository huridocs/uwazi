/**
 * @jest-environment jsdom
 */
import React, { act } from 'react';
import { fireEvent, render, RenderResult } from '@testing-library/react';
import { TestAtomStoreProvider } from 'V2/testing';
import { settingsAtom, translationsAtom, inlineEditAtom, notificationAtom } from 'V2/atoms';
import * as translationsAPI from 'V2/api/translations';
import { NotificationsContainer } from 'V2/Components/UI';
import { TranslateModal } from '../TranslateModal';
import { languages, translations } from './fixtures';

describe('TranslateModal', () => {
  let renderResult: RenderResult;

  beforeAll(() => {
    jest.spyOn(translationsAPI, 'postV2').mockImplementation(async () => Promise.resolve(200));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const renderComponent = (inlineEdit: boolean, context: string, translationKey: string) => {
    renderResult = render(
      <TestAtomStoreProvider
        initialValues={[
          [settingsAtom, { languages }],
          [translationsAtom, translations],
          [inlineEditAtom, { inlineEdit, context, translationKey }],
          [notificationAtom, {}],
        ]}
      >
        <TranslateModal />
        <NotificationsContainer />
      </TestAtomStoreProvider>
    );
  };

  it('renders the modal with fields for each language', () => {
    renderComponent(true, 'System', 'Search');
    const inputFields = renderResult.queryAllByRole('textbox');
    expect(inputFields).toHaveLength(2);
    expect(inputFields[0]).toHaveValue('Search');
    expect(inputFields[1]).toHaveValue('Buscar');
    expect(renderResult.getByText('EN'));
    expect(renderResult.getByText('ES'));
  });

  it('should close the modal without saving', async () => {
    renderComponent(true, 'System', 'Search');
    expect(renderResult.getByText('Translate'));
    await act(() => {
      fireEvent.click(renderResult.getByText('Cancel'));
    });
    expect(renderResult.queryByText('Translate')).not.toBeInTheDocument();
    expect(translationsAPI.postV2).not.toHaveBeenCalled();
  });

  // eslint-disable-next-line max-statements
  it('submits the form with updated values, disables while saving, and closes the modal', async () => {
    renderComponent(true, 'System', 'Search');

    const saveButton = renderResult.getByTestId('save-button');
    const inputFields = renderResult.queryAllByRole('textbox');
    const cancelButton = renderResult.getByText('Cancel');

    await act(() => {
      fireEvent.change(inputFields[1], { target: { value: 'Busqueda' } });
      fireEvent.click(saveButton);
    });

    expect(saveButton).toBeDisabled();
    expect(inputFields[0]).toBeDisabled();
    expect(inputFields[1]).toBeDisabled();
    expect(cancelButton).toBeDisabled();

    expect(translationsAPI.postV2).toHaveBeenCalledWith(
      [
        { language: 'en', value: 'Search', key: 'Search' },
        { language: 'es', value: 'Busqueda', key: 'Search' },
      ],
      translations[0].contexts[0]
    );
    expect(renderResult.queryByText('Translate')).not.toBeInTheDocument();
    expect(renderResult.queryByText('Translations saved')).toBeInTheDocument();
  });

  it('should not allow sending empty fields', async () => {
    renderComponent(true, 'System', 'Search');
    const inputFields = renderResult.queryAllByRole('textbox');
    const saveButton = renderResult.getByTestId('save-button');

    await act(() => {
      fireEvent.change(inputFields[0], { target: { value: '' } });
      fireEvent.click(saveButton);
    });

    expect(translationsAPI.postV2).not.toHaveBeenCalled();
  });

  it('should use the default context key if translation does not exist', async () => {
    renderComponent(true, 'System', 'This key is not in the database');
    const inputFields = renderResult.queryAllByRole('textbox');
    expect(inputFields[0]).toHaveValue('This key is not in the database');
    expect(inputFields[1]).toHaveValue('This key is not in the database');
    const saveButton = renderResult.getByTestId('save-button');

    await act(() => {
      fireEvent.change(inputFields[0], { target: { value: 'My new key' } });
      fireEvent.change(inputFields[1], { target: { value: 'Nueva llave' } });
      fireEvent.click(saveButton);
    });

    expect(translationsAPI.postV2).toHaveBeenCalledWith(
      [
        { language: 'en', value: 'My new key', key: 'This key is not in the database' },
        { language: 'es', value: 'Nueva llave', key: 'This key is not in the database' },
      ],
      translations[0].contexts[0]
    );
    expect(renderResult.queryByText('Translate')).not.toBeInTheDocument();
  });

  it('should not save if there are no changes', async () => {
    renderComponent(true, 'System', 'Search');
    const saveButton = renderResult.getByTestId('save-button');
    const inputFields = renderResult.queryAllByRole('textbox');

    await act(() => {
      fireEvent.change(inputFields[1], { target: { value: 'Nueva traducción' } });
      fireEvent.change(inputFields[1], { target: { value: 'Buscar' } });
      fireEvent.click(saveButton);
    });

    expect(translationsAPI.postV2).not.toHaveBeenCalled();
  });
});
