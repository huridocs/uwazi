/**
 * @jest-environment jsdom
 */
import React from 'react';
import { act, render, screen, within } from '@testing-library/react';
import * as reactRouter from 'react-router';
import { api } from '#app/utils/api.js';
import { socket } from '#app/socket.js';
import { TestAtomStoreProvider } from '#V2/testing/TestAtomStoreProvider.js';
import { templatesAtom, localeAtom, translationsAtom } from '#V2/atoms/index.js';
import { TestRouterContext } from '#V2/testing/TestRouterContext.js';
import { csvImportsList, templates, translations } from './fixtures.js';
import { UploadStatus } from '../../UploadStatus.js';
import type { CsvImportListRow } from '#app/V2/api/csv/index.js';
import { csvImportEvents } from '#app/V2/api/csv/events.js';

describe('CSV import status view', () => {
  let locale: 'en' | 'ar' = 'en';
  let revalidateMock: jest.Mock;
  let listeners: Record<string, any>;

  beforeEach(() => {
    locale = 'en';
    revalidateMock = jest.fn();
    listeners = {};

    jest.spyOn(reactRouter, 'useRevalidator').mockReturnValue({
      revalidate: revalidateMock,
      state: 'idle',
    });

    jest.spyOn(socket, 'on').mockImplementation((event: string, callback: any) => {
      listeners[event] = callback;
      return socket;
    });

    jest.spyOn(socket, 'off').mockImplementation((event: string) => {
      delete listeners[event];
      return socket;
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const renderComponent = async (data?: CsvImportListRow) => {
    await act(() => {
      render(
        <TestRouterContext loaderData={data}>
          <TestAtomStoreProvider
            initialValues={[
              [templatesAtom, templates],
              [localeAtom, locale],
              [translationsAtom, translations],
            ]}
          >
            <UploadStatus />
          </TestAtomStoreProvider>
        </TestRouterContext>
      );
    });
  };

  it('should not fail if the import is not found', async () => {
    await renderComponent();
    expect(screen.getAllByText('Not Found')[0]).toBeInTheDocument();
  });

  it('should display the current status', async () => {
    await renderComponent(csvImportsList[1]);

    const expectStatistic = (label: string, value: string) => {
      const labelNode = screen.getByText(label);
      const statContainer = labelNode.parentElement;

      expect(statContainer).not.toBeNull();
      expect(statContainer).toHaveTextContent(value);
      expect(statContainer).toHaveTextContent(label);
    };

    expectStatistic('Entities created', '44');
    expectStatistic('Rows processed', '48');
    expectStatistic('Rows failed', '1');
    expectStatistic('Thesauri values created', '-');
    expectStatistic('Related entities created', '-');
  });

  it('should render errors table with the correct row error details', async () => {
    await renderComponent(csvImportsList[3]);

    const errorsTable = screen.getByRole('table');

    expect(within(errorsTable).getByRole('columnheader', { name: 'Row' })).toBeInTheDocument();
    expect(within(errorsTable).getByRole('columnheader', { name: 'Property' })).toBeInTheDocument();
    expect(within(errorsTable).getByRole('columnheader', { name: 'Message' })).toBeInTheDocument();

    const [, ...errorRows] = within(errorsTable).getAllByRole('row');

    expect(errorRows).toHaveLength(2);

    expect(errorRows[0]).toHaveTextContent('18');
    expect(errorRows[0]).toHaveTextContent('related_case');
    expect(errorRows[0]).toHaveTextContent(
      'Relationship value could not be resolved to an existing entity.'
    );

    expect(errorRows[1]).toHaveTextContent('19');
    expect(errorRows[1]).toHaveTextContent('file');
    expect(errorRows[1]).toHaveTextContent('Referenced file was not found in the import package.');
  });

  it('should revalidate once on different events', async () => {
    const onSpy = jest.spyOn(socket, 'on');
    const offSpy = jest.spyOn(socket, 'off');

    let unmount: () => void;
    await act(() => {
      const result = render(
        <TestRouterContext loaderData={csvImportsList[1]}>
          <TestAtomStoreProvider
            initialValues={[
              [templatesAtom, templates],
              [localeAtom, locale],
              [translationsAtom, translations],
            ]}
          >
            <UploadStatus />
          </TestAtomStoreProvider>
        </TestRouterContext>
      );
      unmount = result.unmount;
    });

    const trackedEvents = [
      csvImportEvents.extractStart,
      csvImportEvents.extractProgress,
      csvImportEvents.extractSuccess,
      csvImportEvents.extractError,
      csvImportEvents.preflightScanStart,
      csvImportEvents.preflightScanSuccess,
      csvImportEvents.preflightScanError,
      csvImportEvents.preflightThesauriCreateStart,
      csvImportEvents.preflightThesauriCreateSuccess,
      csvImportEvents.preflightThesauriCreateError,
      csvImportEvents.preflightRelationshipsCreateStart,
      csvImportEvents.preflightRelationshipsCreateSuccess,
      csvImportEvents.preflightRelationshipsCreateError,
      csvImportEvents.importStart,
      csvImportEvents.importProgress,
      csvImportEvents.importSuccess,
      csvImportEvents.importError,
    ];

    trackedEvents.forEach(event => {
      expect(onSpy).toHaveBeenCalledWith(event, expect.any(Function));
    });

    await act(async () => {
      listeners[csvImportEvents.importProgress]({ importId: 'csv-import-2' });
      listeners[csvImportEvents.importSuccess]({ importId: 'csv-import-2' });
      listeners[csvImportEvents.importError]({
        importId: 'csv-import-2',
        message: 'Boom',
      });
    });

    expect(revalidateMock).toHaveBeenCalledTimes(1);

    await act(async () => {
      unmount();
    });

    trackedEvents.forEach(event => {
      expect(offSpy).toHaveBeenCalledWith(event, expect.any(Function));
    });
  });

  it('should not revalidate for other uploads', async () => {
    await renderComponent(csvImportsList[2]);

    await act(async () => {
      listeners[csvImportEvents.importProgress]({ importId: 'csv-import-2' });
      listeners[csvImportEvents.importSuccess]({ importId: 'csv-import-2' });
      listeners[csvImportEvents.importError]({
        importId: 'csv-import-2',
        message: 'Boom',
      });
    });

    expect(revalidateMock).toHaveBeenCalledTimes(0);
  });

  it('should not allow canceling finished imports', async () => {
    await renderComponent(csvImportsList[2]);
    expect(screen.getByText('Cancel').parentElement).toBeDisabled();
  });

  it('should cancel a process', async () => {
    jest.spyOn(api, 'post').mockResolvedValue({ json: {} });

    await renderComponent(csvImportsList[1]);

    await act(() => {
      screen.getByText('Cancel').parentElement?.click();
    });

    await act(() => {
      const modal = screen.getByTestId('modal');
      within(modal).getByText('Cancel').click();
    });

    expect(api.post).toHaveBeenCalledWith('csvImportEntities/imports/csv-import-2/cancel', {
      data: undefined,
      headers: {},
    });

    expect(revalidateMock).toHaveBeenCalledTimes(1);
  });
});
