/**
 * @jest-environment jsdom
 */
import React, { act } from 'react';
import { fireEvent, render, RenderResult, waitFor } from '@testing-library/react';
import { TestAtomStoreProvider } from '#V2/testing/index.js';
import { settingsAtom, translationsAtom, inlineEditAtom } from '#V2/atoms/index.js';
import * as translationsAPI from '#V2/api/translations/index.js';
import { RequestStatus } from '#V2/Components/UI/Notifications/RequestStatus.js';
import { TranslateModal } from '../TranslateModal.js';
import { languages, translations } from './fixtures.js';

describe('TranslateModal', () => {
  let renderResult: RenderResult;

  beforeAll(() => {
    jest.spyOn(translationsAPI, 'postV2').mockImplementation(async () => Promise.resolve(200));
    jest
      .spyOn(translationsAPI, 'get')
      .mockImplementation(async () => Promise.resolve(translations));
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.spyOn(translationsAPI, 'postV2').mockImplementation(async () => Promise.resolve(200));
    jest
      .spyOn(translationsAPI, 'get')
      .mockImplementation(async () => Promise.resolve(translations));
  });

  const renderComponent = (
    inlineEdit: boolean,
    context: string,
    translationKey: string,
    storeTranslations = translations
  ) => {
    renderResult = render(
      <TestAtomStoreProvider
        initialValues={[
          [settingsAtom, { languages }],
          [translationsAtom, storeTranslations],
          [inlineEditAtom, { inlineEdit, context, translationKey }],
        ]}
      >
        <TranslateModal />
        <RequestStatus />
      </TestAtomStoreProvider>
    );
  };

  it('renders the modal with fields for each language', async () => {
    renderComponent(true, 'System', 'Search');
    await waitFor(() => {
      expect(renderResult.queryAllByRole('textbox')).toHaveLength(2);
    });
    const inputFields = renderResult.queryAllByRole('textbox');
    expect(inputFields[0]).toHaveValue('Search');
    expect(inputFields[1]).toHaveValue('Buscar');
    expect(renderResult.getByText('EN'));
    expect(renderResult.getByText('ES'));
    expect(translationsAPI.get).toHaveBeenCalledWith(undefined, { context: 'System' });
  });

  it('fetches all languages for the context when the store only has the active locale', async () => {
    renderComponent(true, 'System', 'Search', [translations[0]]);
    await waitFor(() => {
      expect(renderResult.queryAllByRole('textbox')).toHaveLength(2);
    });
    expect(renderResult.getByText('EN'));
    expect(renderResult.getByText('ES'));
  });

  it('should close the modal without saving', async () => {
    renderComponent(true, 'System', 'Search');
    await waitFor(() => {
      expect(renderResult.getByText('Translate')).toBeInTheDocument();
    });
    await act(() => {
      fireEvent.click(renderResult.getByText('Cancel'));
    });
    expect(renderResult.queryByText('Translate')).not.toBeInTheDocument();
    expect(translationsAPI.postV2).not.toHaveBeenCalled();
  });

  // eslint-disable-next-line max-statements
  it('submits the form with updated values, disables while saving, and closes the modal', async () => {
    renderComponent(true, 'System', 'Search');
    await waitFor(() => {
      expect(renderResult.queryAllByRole('textbox')).toHaveLength(2);
    });

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
    await act(() => {
      fireEvent.click(renderResult.getByTestId('status-dot'));
    });
    expect(renderResult.queryByText('Translations saved')).toBeInTheDocument();
  });

  it('should not allow sending empty fields', async () => {
    renderComponent(true, 'System', 'Search');
    await waitFor(() => {
      expect(renderResult.queryAllByRole('textbox')).toHaveLength(2);
    });
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
    await waitFor(() => {
      expect(renderResult.queryAllByRole('textbox')).toHaveLength(2);
    });
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
    await waitFor(() => {
      expect(renderResult.queryAllByRole('textbox')).toHaveLength(2);
    });
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
