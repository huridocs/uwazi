/**
 * @jest-environment jsdom
 */
import React from 'react';
import { Provider } from 'jotai';
import { act, render, screen, within } from '@testing-library/react';
import * as reactRouter from 'react-router';
import { socket } from '#app/socket.js';
import { getStore } from '#shared/atomStore/index.js';
import { csvImportEvents } from '#V2/api/csv/events.js';
import { templatesAtom, localeAtom, translationsAtom } from '#V2/atoms/index.js';
import { TestRouterContext } from '#V2/testing/TestRouterContext.js';
import { ImportsTable } from '../ImportsTable.js';
import { csvImportsList, templates, translations } from './fixtures.js';

describe('CSV imports list table', () => {
  const atomStore = getStore();

  let locale: 'en' | 'es' = 'en';
  let revalidateMock: jest.Mock;
  let listeners: Record<string, any>;

  beforeEach(() => {
    locale = 'en';
    revalidateMock = jest.fn();
    listeners = {};

    atomStore.set(templatesAtom, templates);
    atomStore.set(translationsAtom, translations);

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
    atomStore.set(localeAtom, locale);

    await act(() => {
      render(
        <TestRouterContext loaderData={{ list: csvImportsList }}>
          <Provider store={atomStore}>
            <ImportsTable />
          </Provider>
        </TestRouterContext>
      );
    });
  };

  it('should render a blank state message if not data', async () => {
    await act(() => {
      atomStore.set(localeAtom, locale);

      render(
        <TestRouterContext loaderData={{ list: [] }}>
          <Provider store={atomStore}>
            <ImportsTable />
          </Provider>
        </TestRouterContext>
      );
    });

    expect(screen.getByText('No CSVs yet')).toBeInTheDocument();
  });

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
      ['Failed', 'documents.csv', 'Documents', '17/60', '15', '2', '4/10/2024, 1:20:00 PM'],
      ['Completed', 'events.csv', 'Events', '86/86', '84', '0', '4/9/2024, 1:20:00 PM'],
      ['Processing', 'cases.zip', 'Cases', '48/120', '44', '1', '4/8/2024, 1:20:00 PM'],
      ['Queued', 'people.csv', 'People', '0/0', '', '', '4/7/2024, 1:20:00 PM'],
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
    locale = 'es';
    await renderComponent();
    expect(screen.getByText('10/4/2024, 13:20:00')).toBeInTheDocument();
  });

  it('should render template names', async () => {
    locale = 'es';
    await renderComponent();
    expect(screen.getByText('Personas')).toBeInTheDocument();
  });

  it('should subscribe and unsubscribe csv stage event listeners', async () => {
    const onSpy = jest.spyOn(socket, 'on');
    const offSpy = jest.spyOn(socket, 'off');

    let unmount: () => void;
    await act(() => {
      atomStore.set(localeAtom, locale);

      const result = render(
        <TestRouterContext loaderData={{ list: csvImportsList }}>
          <Provider store={atomStore}>
            <ImportsTable />
          </Provider>
        </TestRouterContext>
      );
      unmount = result.unmount;
    });

    const expectedEvents = [
      csvImportEvents.importStart,
      csvImportEvents.extractStart,
      csvImportEvents.importProgress,
      csvImportEvents.extractSuccess,
      csvImportEvents.extractError,
      csvImportEvents.preflightScanSuccess,
      csvImportEvents.preflightScanError,
      csvImportEvents.preflightThesauriCreateSuccess,
      csvImportEvents.preflightThesauriCreateError,
      csvImportEvents.preflightRelationshipsCreateSuccess,
      csvImportEvents.preflightRelationshipsCreateError,
      csvImportEvents.importSuccess,
      csvImportEvents.importError,
    ];

    expectedEvents.forEach(event => {
      expect(onSpy).toHaveBeenCalledWith(event, expect.any(Function));
    });

    await act(async () => {
      unmount();
    });

    expectedEvents.forEach(event => {
      expect(offSpy).toHaveBeenCalledWith(event, expect.any(Function));
    });
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
