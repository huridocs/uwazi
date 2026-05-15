/**
 * @jest-environment jsdom
 */
import React from 'react';
import { createStore } from 'jotai';
import { Provider } from 'jotai';
import { useHydrateAtoms } from 'jotai/utils';
import { render, waitFor } from '@testing-library/react';
import { userAtom } from '#V2/atoms/userAtom.js';
import { requestStatusAtom } from '#V2/atoms/requestStatusAtom.js';
import { csvImportEvents } from '#V2/api/csv/events.js';
import { CsvImportStatus } from '#V2/api/csv/index.js';
import { CsvImportTasksSubscriber } from '../CsvImportTasksSubscriber.js';

const mockOn = jest.fn();
const mockOff = jest.fn();

jest.mock('#app/socket.js', () => ({
  socket: {
    on: (...args: unknown[]) => mockOn(...args),
    off: (...args: unknown[]) => mockOff(...args),
  },
}));

const mockGet = jest.fn();

jest.mock('#V2/api/csv/index.js', () => ({
  ...jest.requireActual('#V2/api/csv/index.js'),
  get: (...args: unknown[]) => mockGet(...args),
}));

const initialRequestStatus = {
  notifications: [],
  unreadNotificationIds: [],
  tasks: [],
  isConnected: true,
  isPanelOpen: false,
  isLoading: false,
};

const TestWrapper = ({
  role,
  store,
  children,
}: {
  role: string;
  store: ReturnType<typeof createStore>;
  children: React.ReactNode;
}) => {
  const Hydrate = () => {
    useHydrateAtoms([
      [userAtom, { _id: 'user-1', role }],
      [requestStatusAtom, initialRequestStatus],
    ]);
    return children;
  };

  return (
    <Provider store={store}>
      <Hydrate />
    </Provider>
  );
};

describe('CsvImportTasksSubscriber', () => {
  const originalFeatureFlags = window.__featureFlags__;

  beforeEach(() => {
    jest.clearAllMocks();
    window.__featureFlags__ = { v2CSVImport: true };
    mockGet.mockResolvedValue([]);
  });

  afterEach(() => {
    window.__featureFlags__ = originalFeatureFlags;
  });

  it('subscribes to csv import socket events for admins', async () => {
    const store = createStore();
    render(
      <TestWrapper role="admin" store={store}>
        <CsvImportTasksSubscriber />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(mockOn).toHaveBeenCalledWith(csvImportEvents.extractStart, expect.any(Function));
      expect(mockOn).toHaveBeenCalledWith(csvImportEvents.importSuccess, expect.any(Function));
      expect(mockOn).toHaveBeenCalledWith(csvImportEvents.importCancelled, expect.any(Function));
    });
  });

  it('does not subscribe when user is not admin', () => {
    const store = createStore();
    render(
      <TestWrapper role="editor" store={store}>
        <CsvImportTasksSubscriber />
      </TestWrapper>
    );
    expect(mockOn).not.toHaveBeenCalled();
  });

  it('does not hydrate imports in stage-done status', async () => {
    mockGet.mockResolvedValue([
      {
        id: 'import-done-stage',
        status: CsvImportStatus.ImportEntitiesDone,
        templateId: 'template-1',
        file: { originalName: 'done-stage.csv', mimeType: 'text/csv', size: 10 },
        createdAt: 0,
        updatedAt: 0,
      },
    ]);

    const store = createStore();
    render(
      <TestWrapper role="admin" store={store}>
        <CsvImportTasksSubscriber />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(mockGet).toHaveBeenCalled();
    });

    const state = store.get(requestStatusAtom);
    expect(state.tasks).toEqual([]);
  });

  it('hydrates running imports on mount', async () => {
    mockGet.mockResolvedValue([
      {
        id: 'import-running',
        status: CsvImportStatus.ImportEntities,
        templateId: 'template-1',
        file: { originalName: 'running.csv', mimeType: 'text/csv', size: 10 },
        createdAt: 0,
        updatedAt: 0,
        progress: { totalRows: 10, processedRows: 5, lastProcessedRow: 5, batchSize: 5 },
      },
    ]);

    const store = createStore();
    render(
      <TestWrapper role="admin" store={store}>
        <CsvImportTasksSubscriber />
      </TestWrapper>
    );

    await waitFor(() => {
      const state = store.get(requestStatusAtom);
      expect(state.tasks).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: 'import-running',
            status: 'running',
            label: expect.stringContaining('running.csv'),
          }),
        ])
      );
    });
  });
});
