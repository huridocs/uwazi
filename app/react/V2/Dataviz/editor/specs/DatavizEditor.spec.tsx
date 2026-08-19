/**
 * @jest-environment jsdom
 */
import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { FetchResponseError } from '#shared/JSONRequest.js';
import { TestAtomStoreProvider } from '#V2/testing/TestAtomStoreProvider.js';
import {
  relationshipTypesAtom,
  settingsAtom,
  templatesAtom,
  thesauriAtom,
} from '#V2/atoms/index.js';
import { DatavizApiProvider } from '#V2/Dataviz/api/DatavizApiContext.js';
import type { DatavizApi } from '#V2/Dataviz/api/contracts.js';
import { DatavizEditor } from '../DatavizEditor.js';
import {
  carsByColorDto,
  createDefaultDatavizDefinition,
  datavizRelationTypes,
  datavizTemplates,
  datavizThesauri,
} from '../../fixtures/datavizFixtures.js';
import { DATAVIZ_DUPLICATE_NAME_CODE } from '../../utils/isDatavizDuplicateNameError.js';

const mockNotify = jest.fn();

jest.mock('#V2/atoms/requestStatusAtom.js', () => ({
  useRequestStatus: () => ({ notify: mockNotify }),
}));

jest.mock('../components/preview/DatavizPreviewPanel.js', () => ({
  DatavizPreviewPanel: () => <div data-testid="dataviz-preview-panel" />,
}));

const duplicateNameError = new FetchResponseError('Request failed', {
  status: 409,
  json: {
    code: DATAVIZ_DUPLICATE_NAME_CODE,
    error: 'A dataviz named "Cars by color" already exists',
  },
});

const renderEditor = (apiOverrides: Partial<DatavizApi> = {}) => {
  const api: DatavizApi = {
    getDefinition: jest.fn(),
    saveDefinition: jest.fn().mockResolvedValue(createDefaultDatavizDefinition()),
    deleteDefinition: jest.fn(),
    getData: jest.fn().mockResolvedValue(carsByColorDto),
    refreshSnapshot: jest.fn(),
    ...apiOverrides,
  };

  render(
    <MemoryRouter>
      <TestAtomStoreProvider
        initialValues={[
          [templatesAtom, datavizTemplates],
          [thesauriAtom, datavizThesauri],
          [relationshipTypesAtom, datavizRelationTypes],
          [settingsAtom, { private: false, languages: [{ key: 'en', default: true }] }],
        ]}
      >
        <DatavizApiProvider api={api}>
          <DatavizEditor initialDefinition={createDefaultDatavizDefinition()} />
        </DatavizApiProvider>
      </TestAtomStoreProvider>
    </MemoryRouter>
  );

  return api;
};

const getEditorTab = (name: string) => screen.getByRole('tab', { name });

describe('DatavizEditor duplicate name validation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should switch to the Info tab and mark the name field when the name already exists', async () => {
    renderEditor({
      saveDefinition: jest.fn().mockRejectedValue(duplicateNameError),
    });

    expect(getEditorTab('Data')).toHaveAttribute('aria-selected', 'true');

    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(getEditorTab('Info')).toHaveAttribute('aria-selected', 'true');
    });

    expect(
      screen.getByText('This data visualization name already exists. Enter a unique name.')
    ).toBeVisible();
    expect(mockNotify).toHaveBeenCalledWith(
      'error',
      'Check your submission. Some information was missing or incorrect. Review the highlighted fields and try again.'
    );
  });

  it('should keep the current tab and show a generic error for other save failures', async () => {
    renderEditor({
      saveDefinition: jest.fn().mockRejectedValue(new Error('network')),
    });

    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(mockNotify).toHaveBeenCalledWith('error', 'An error occurred');
    });

    expect(getEditorTab('Data')).toHaveAttribute('aria-selected', 'true');
    expect(
      screen.queryByText('This data visualization name already exists. Enter a unique name.')
    ).not.toBeInTheDocument();
  });

  it('should clear the name error when the user changes the name', async () => {
    renderEditor({
      saveDefinition: jest.fn().mockRejectedValue(duplicateNameError),
    });

    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(
        screen.getByText('This data visualization name already exists. Enter a unique name.')
      ).toBeVisible();
    });

    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Unique chart' } });

    expect(
      screen.queryByText('This data visualization name already exists. Enter a unique name.')
    ).not.toBeInTheDocument();
  });
});
