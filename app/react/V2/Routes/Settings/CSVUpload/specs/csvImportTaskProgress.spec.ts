import { csvImportEvents } from '#V2/api/csv/events.js';
import { CsvImportStatus } from '#V2/api/csv/index.js';
import {
  buildTaskLabel,
  computeProgressFromRow,
  handleCsvImportSocketEvent,
  mergeTaskLabel,
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

  it('builds task label with CSV Import prefix and file name', () => {
    expect(buildTaskLabel('Scanning', 'data.csv')).toContain('CSV Import');
    expect(buildTaskLabel('Scanning', 'data.csv')).toContain('Scanning');
    expect(buildTaskLabel('Scanning', 'data.csv')).toContain('data.csv');
  });

  it('builds generic task label without file name', () => {
    const label = buildTaskLabel('Creating entities');
    expect(label).toContain('CSV Import');
    expect(label).toContain('Creating entities');
    expect(/[a-f0-9]{24}/.test(label)).toBe(false);
  });

  it('merges file name from an existing task label', () => {
    expect(mergeTaskLabel('CSV Import: Queued — report.csv', 'CSV Import: Creating entities')).toBe(
      'CSV Import: Creating entities — report.csv'
    );
  });

  it('uses generic label when there is no existing task', () => {
    const { handlers, ensureTask } = createHandlers();

    handleCsvImportSocketEvent(csvImportEvents.importStart, { importId }, handlers);

    expect(ensureTask).toHaveBeenCalledWith(
      importId,
      expect.stringMatching(/^CSV Import: Creating entities$/),
      undefined
    );
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

    handleCsvImportSocketEvent(csvImportEvents.extractStart, { importId }, handlers);

    expect(ensureTask).toHaveBeenCalledWith(
      importId,
      expect.stringMatching(/CSV Import: Extracting files/),
      undefined
    );
  });

  it('updates progress on import progress event with created and updated rows in batch', () => {
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
        entitiesUpdatedInBatch: 7,
      },
      handlers
    );

    expect(ensureTask).toHaveBeenCalledWith(importId, expect.any(String), 50);
  });

  it('completes task and notifies on import success', () => {
    const { handlers, completeTask, notifySuccess } = createHandlers();

    handleCsvImportSocketEvent(csvImportEvents.importSuccess, { importId }, handlers);

    expect(completeTask).toHaveBeenCalledWith(importId);
    expect(notifySuccess).toHaveBeenCalledWith();
  });

  it('fails task and notifies on import error', () => {
    const { handlers, failTask, notifyError } = createHandlers();

    handleCsvImportSocketEvent(
      csvImportEvents.importError,
      { importId, message: 'Something went wrong' },
      handlers
    );

    expect(failTask).toHaveBeenCalledWith(importId);
    expect(notifyError).toHaveBeenCalledWith(undefined, 'Something went wrong');
  });

  it('uses next-stage label on intermediate success, not Done stage title', () => {
    const { handlers, ensureTask } = createHandlers();

    handleCsvImportSocketEvent(
      csvImportEvents.preflightRelationshipsCreateSuccess,
      { importId },
      handlers
    );

    expect(ensureTask).toHaveBeenCalledWith(
      importId,
      expect.stringMatching(/CSV Import: Creating entities/),
      undefined
    );
    expect(ensureTask).not.toHaveBeenCalledWith(
      importId,
      expect.stringMatching(/Done creating/),
      undefined
    );
  });

  it('completes task and notifies on import cancelled', () => {
    const { handlers, completeTask, notifyCancelled } = createHandlers();

    handleCsvImportSocketEvent(csvImportEvents.importCancelled, { importId }, handlers);

    expect(completeTask).toHaveBeenCalledWith(importId);
    expect(notifyCancelled).toHaveBeenCalledWith();
  });
});
