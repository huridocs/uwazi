/**
 * @jest-environment jsdom
 */
import React from 'react';
import { act, render, screen, within } from '@testing-library/react';
import * as reactRouter from 'react-router';
import { socket } from '#app/socket.js';
import { TestAtomStoreProvider } from '#V2/testing/TestAtomStoreProvider.js';
import { csvImportEvents } from '#V2/api/csv/events.js';
import { templatesAtom, localeAtom, translationsAtom } from '#V2/atoms/index.js';
import { TestRouterContext } from '#V2/testing/TestRouterContext.js';
import { ImportsTable } from '../ImportsTable.js';
import { csvImportsList, templates, translations } from './fixtures.js';

describe('CSV imports list table', () => {
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

  const renderComponent = async () => {
    await act(() => {
      render(
        <TestRouterContext loaderData={{ list: csvImportsList }}>
          <TestAtomStoreProvider
            initialValues={[
              [templatesAtom, templates],
              [localeAtom, locale],
              [translationsAtom, translations],
            ]}
          >
            <ImportsTable />
          </TestAtomStoreProvider>
        </TestRouterContext>
      );
    });
  };

  it('should display the general statistics', async () => {
    await renderComponent();

    const expectStatistic = (label: string, value: string) => {
      const labelNode = within(screen.getByTestId('table-header')).getByText(label);
      const statContainer = labelNode.parentElement;

      expect(statContainer).not.toBeNull();
      expect(statContainer).toHaveTextContent(value);
      expect(statContainer).toHaveTextContent(label);
    };

    expectStatistic('Total imports', '4');
    expectStatistic('Processing', '1');
    expectStatistic('Completed', '1');
    expectStatistic('Failed jobs', '1');
  });

  it('should render the data in the tables', async () => {
    await renderComponent();

    const expectedRows = [
      ['Queued', 'people.csv', 'People', '0/0', '', '', 'Apr 7, 2024'],
      ['Processing', 'cases.zip', 'Cases', '48/120', '44', '1', 'Apr 8, 2024'],
      ['Completed', 'events.csv', 'Events', '86/86', '84', '0', 'Apr 9, 2024'],
      ['Failed', 'documents.csv', 'Documents', '17/60', '15', '2', 'Apr 10, 2024'],
    ];

    const rows = screen.getAllByRole('row').slice(1);
    expect(rows).toHaveLength(expectedRows.length);

    expectedRows.forEach((expectedCells, index) => {
      const cells = within(rows[index]).getAllByRole('cell');
      expectedCells.forEach((value, cellIndex) => {
        expect(cells[cellIndex]).toHaveTextContent(value);
      });
    });
  });

  it('should print date based on locale', async () => {
    locale = 'ar';
    await renderComponent();
    expect(screen.getByText('7 أبريل 2024')).toBeInTheDocument();
  });

  it('should render template names', async () => {
    locale = 'ar';
    await renderComponent();
    expect(screen.getByText('People')).toBeInTheDocument();
  });

  it('should subscribe and unsubscribe import event listeners', async () => {
    const onSpy = jest.spyOn(socket, 'on');
    const offSpy = jest.spyOn(socket, 'off');

    let unmount: () => void;
    await act(() => {
      const result = render(
        <TestRouterContext loaderData={{ list: csvImportsList }}>
          <TestAtomStoreProvider
            initialValues={[
              [templatesAtom, templates],
              [localeAtom, locale],
              [translationsAtom, translations],
            ]}
          >
            <ImportsTable />
          </TestAtomStoreProvider>
        </TestRouterContext>
      );
      unmount = result.unmount;
    });

    expect(onSpy).toHaveBeenCalledWith(csvImportEvents.importStart, expect.any(Function));
    expect(onSpy).toHaveBeenCalledWith(csvImportEvents.importProgress, expect.any(Function));
    expect(onSpy).toHaveBeenCalledWith(csvImportEvents.importSuccess, expect.any(Function));
    expect(onSpy).toHaveBeenCalledWith(csvImportEvents.importError, expect.any(Function));

    await act(async () => {
      unmount();
    });

    expect(offSpy).toHaveBeenCalledWith(csvImportEvents.importStart, expect.any(Function));
    expect(offSpy).toHaveBeenCalledWith(csvImportEvents.importProgress, expect.any(Function));
    expect(offSpy).toHaveBeenCalledWith(csvImportEvents.importSuccess, expect.any(Function));
    expect(offSpy).toHaveBeenCalledWith(csvImportEvents.importError, expect.any(Function));
  });

  it('should update only the target row progress on import progress events', async () => {
    await renderComponent();

    expect(screen.getByText('48/120')).toBeInTheDocument();
    expect(screen.getByText('17/60')).toBeInTheDocument();

    await act(async () => {
      listeners[csvImportEvents.importProgress]({
        importId: 'csv-import-2',
        processedRows: 88,
        totalRows: 120,
        batchIndex: 4,
        batchCount: 6,
        entitiesCreatedInBatch: 10,
      });
    });

    expect(screen.getByText('88/120')).toBeInTheDocument();
    expect(screen.getByText('17/60')).toBeInTheDocument();
  });

  it('should revalidate on import start and throttle success and error events', async () => {
    await renderComponent();

    await act(async () => {
      listeners[csvImportEvents.importStart]({ importId: 'csv-import-2' });
      listeners[csvImportEvents.importSuccess]({ importId: 'csv-import-2' });
      listeners[csvImportEvents.importError]({
        importId: 'csv-import-2',
        message: 'Boom',
      });
    });

    expect(revalidateMock).toHaveBeenCalledTimes(2);
  });
});
