import { csvImportEvents } from '#V2/api/csv/events.js';
import { CsvImportStatus } from '#V2/api/csv/index.js';
import {
  buildTaskLabel,
  computeProgressFromRow,
  handleCsvImportSocketEvent,
} from '../csvImportTaskProgress.js';

describe('csvImportTaskProgress', () => {
  const fileName = 'report.csv';
  const importId = 'import-1';

  const createHandlers = () => {
    const ensureTask = jest.fn();
    const updateTask = jest.fn();
    const completeTask = jest.fn();
    const failTask = jest.fn();
    const notifySuccess = jest.fn();
    const notifyError = jest.fn();
    const notifyCancelled = jest.fn();

    return {
      handlers: {
        ensureTask,
        updateTask,
        completeTask,
        failTask,
        notifySuccess,
        notifyError,
        notifyCancelled,
        getMeta: () => ({ fileName }),
      },
      ensureTask,
      updateTask,
      completeTask,
      failTask,
      notifySuccess,
      notifyError,
      notifyCancelled,
    };
  };

  it('builds task label with stage and file name', () => {
    expect(buildTaskLabel('data.csv', 'Scanning')).toBe('Scanning: data.csv');
  });

  it('computes progress from import row', () => {
    expect(
      computeProgressFromRow({
        id: importId,
        status: CsvImportStatus.ImportEntities,
        templateId: 't1',
        file: { originalName: fileName, mimeType: 'text/csv', size: 1 },
        createdAt: 0,
        updatedAt: 0,
        progress: { totalRows: 100, processedRows: 40, lastProcessedRow: 40, batchSize: 10 },
      })
    ).toBe(40);
  });

  it('updates task on extract start', () => {
    const { handlers, ensureTask } = createHandlers();

    handleCsvImportSocketEvent(
      csvImportEvents.extractStart,
      { importId },
      handlers
    );

    expect(ensureTask).toHaveBeenCalledWith(
      importId,
      expect.stringContaining(fileName),
      undefined
    );
  });

  it('updates progress on import progress event', () => {
    const { handlers, ensureTask } = createHandlers();

    handleCsvImportSocketEvent(
      csvImportEvents.importProgress,
      {
        importId,
        processedRows: 50,
        totalRows: 100,
        batchIndex: 1,
        batchCount: 2,
        entitiesCreatedInBatch: 10,
      },
      handlers
    );

    expect(ensureTask).toHaveBeenCalledWith(importId, expect.any(String), 50);
  });

  it('completes task and notifies on import success', () => {
    const { handlers, completeTask, notifySuccess } = createHandlers();

    handleCsvImportSocketEvent(
      csvImportEvents.importSuccess,
      { importId },
      handlers
    );

    expect(completeTask).toHaveBeenCalledWith(importId);
    expect(notifySuccess).toHaveBeenCalledWith(fileName);
  });

  it('fails task and notifies on import error', () => {
    const { handlers, failTask, notifyError } = createHandlers();

    handleCsvImportSocketEvent(
      csvImportEvents.importError,
      { importId, message: 'Something went wrong' },
      handlers
    );

    expect(failTask).toHaveBeenCalledWith(importId);
    expect(notifyError).toHaveBeenCalledWith(fileName, 'Something went wrong');
  });

  it('completes task and notifies on import cancelled', () => {
    const { handlers, completeTask, notifyCancelled } = createHandlers();

    handleCsvImportSocketEvent(
      csvImportEvents.importCancelled,
      { importId },
      handlers
    );

    expect(completeTask).toHaveBeenCalledWith(importId);
    expect(notifyCancelled).toHaveBeenCalledWith(fileName);
  });
});
