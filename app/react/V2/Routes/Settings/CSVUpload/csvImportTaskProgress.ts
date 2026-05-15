import { t } from '#app/I18N/index.js';
import { csvImportEvents } from '#V2/api/csv/events.js';
import type { CsvImportEventPayloads } from '#V2/api/csv/events.js';
import { CsvImportStatus, type CsvImportListRow } from '#V2/api/csv/index.js';
import { statusMessages } from './Components/statusMessages.js';

type CsvImportMeta = {
  fileName: string;
};

type CsvImportTaskHandlers = {
  ensureTask: (importId: string, label: string, progress?: number) => void;
  updateTask: (importId: string, updates: { label?: string; progress?: number }) => void;
  completeTask: (importId: string) => void;
  failTask: (importId: string) => void;
  notifySuccess: (fileName: string) => void;
  notifyError: (fileName: string, message: string) => void;
  notifyCancelled: (fileName: string) => void;
  getMeta: (importId: string) => CsvImportMeta | undefined;
};

const TERMINAL_IMPORT_STATUSES = new Set<CsvImportStatus>([
  CsvImportStatus.Completed,
  CsvImportStatus.Failed,
  CsvImportStatus.Cancelled,
]);

const isTerminalImportStatus = (status: CsvImportStatus) => TERMINAL_IMPORT_STATUSES.has(status);

const buildTaskLabel = (fileName: string, stageTitle: string) => `${stageTitle}: ${fileName}`;

const computeProgressFromRow = (row: CsvImportListRow): number | undefined => {
  const { totalRows, processedRows } = row.progress ?? { totalRows: 0, processedRows: 0 };
  if (totalRows <= 0) {
    return undefined;
  }
  return Math.round((processedRows / totalRows) * 100);
};

const computeProgressFromPayload = (
  event: string,
  payload: CsvImportEventPayloads[keyof CsvImportEventPayloads]
): number | undefined => {
  if (event === csvImportEvents.preflightScanProgress) {
    const p = payload as CsvImportEventPayloads[typeof csvImportEvents.preflightScanProgress];
    if (p.totalRows <= 0) return undefined;
    return Math.round((p.processedRows / p.totalRows) * 100);
  }
  if (event === csvImportEvents.preflightThesauriCreateProgress) {
    const p =
      payload as CsvImportEventPayloads[typeof csvImportEvents.preflightThesauriCreateProgress];
    if (p.totalThesauri <= 0) return undefined;
    return Math.round((p.processedThesauri / p.totalThesauri) * 100);
  }
  if (event === csvImportEvents.preflightRelationshipsCreateProgress) {
    const p =
      payload as CsvImportEventPayloads[typeof csvImportEvents.preflightRelationshipsCreateProgress];
    if (p.totalTemplates <= 0) return undefined;
    return Math.round((p.processedTemplates / p.totalTemplates) * 100);
  }
  if (event === csvImportEvents.importProgress) {
    const p = payload as CsvImportEventPayloads[typeof csvImportEvents.importProgress];
    if (p.totalRows <= 0) return undefined;
    return Math.round((p.processedRows / p.totalRows) * 100);
  }
  return undefined;
};

const getStageTitleForEvent = (event: string): string => {
  switch (event) {
    case csvImportEvents.extractStart:
      return statusMessages[CsvImportStatus.ExtractingFiles].title;
    case csvImportEvents.extractSuccess:
      return statusMessages[CsvImportStatus.ExtractingFilesDone].title;
    case csvImportEvents.preflightScanStart:
      return statusMessages[CsvImportStatus.PreflightScan].title;
    case csvImportEvents.preflightScanSuccess:
      return statusMessages[CsvImportStatus.PreflightScanDone].title;
    case csvImportEvents.preflightThesauriCreateStart:
      return statusMessages[CsvImportStatus.PreflightThesauriCreate].title;
    case csvImportEvents.preflightThesauriCreateSuccess:
      return statusMessages[CsvImportStatus.PreflightThesauriCreateDone].title;
    case csvImportEvents.preflightRelationshipsCreateStart:
      return statusMessages[CsvImportStatus.PreflightRelationshipsCreate].title;
    case csvImportEvents.preflightRelationshipsCreateSuccess:
      return statusMessages[CsvImportStatus.PreflightRelationshipsCreateDone].title;
    case csvImportEvents.importStart:
      return statusMessages[CsvImportStatus.ImportEntities].title;
    default:
      if (event.endsWith(':progress')) {
        if (event.startsWith('csvImport:extract:')) {
          return statusMessages[CsvImportStatus.ExtractingFiles].title;
        }
        if (event.startsWith('csvImport:preflight:scan:')) {
          return statusMessages[CsvImportStatus.PreflightScan].title;
        }
        if (event.startsWith('csvImport:preflight:thesauri:')) {
          return statusMessages[CsvImportStatus.PreflightThesauriCreate].title;
        }
        if (event.startsWith('csvImport:preflight:relationships:')) {
          return statusMessages[CsvImportStatus.PreflightRelationshipsCreate].title;
        }
        if (event.startsWith('csvImport:import:')) {
          return statusMessages[CsvImportStatus.ImportEntities].title;
        }
      }
      return statusMessages[CsvImportStatus.Processing].title;
  }
};

const resolveFileName = (importId: string, handlers: CsvImportTaskHandlers) =>
  handlers.getMeta(importId)?.fileName ?? importId;

const handleCsvImportSocketEvent = (
  event: string,
  payload: CsvImportEventPayloads[keyof CsvImportEventPayloads],
  handlers: CsvImportTaskHandlers
) => {
  const importId = payload.importId;
  const fileName = resolveFileName(importId, handlers);

  if (event === csvImportEvents.importCancelled) {
    const label = buildTaskLabel(fileName, statusMessages[CsvImportStatus.Cancelled].title);
    handlers.ensureTask(importId, label);
    handlers.updateTask(importId, { label });
    handlers.completeTask(importId);
    handlers.notifyCancelled(fileName);
    return;
  }

  if (event.endsWith(':error')) {
    const message = 'message' in payload ? payload.message : '';
    const label = buildTaskLabel(fileName, statusMessages[CsvImportStatus.Failed].title);
    handlers.ensureTask(importId, label);
    handlers.failTask(importId);
    handlers.notifyError(fileName, message);
    return;
  }

  if (event === csvImportEvents.importSuccess) {
    const label = buildTaskLabel(fileName, statusMessages[CsvImportStatus.Completed].title);
    handlers.ensureTask(importId, label, 100);
    handlers.completeTask(importId);
    handlers.notifySuccess(fileName);
    return;
  }

  const stageTitle = getStageTitleForEvent(event);
  const label = buildTaskLabel(fileName, stageTitle);
  const progress = computeProgressFromPayload(event, payload);
  handlers.ensureTask(importId, label, progress);

  if (event.endsWith(':success')) {
    handlers.updateTask(importId, { label, ...(progress !== undefined && { progress }) });
  }
};

const buildHydrationLabel = (row: CsvImportListRow) =>
  buildTaskLabel(row.file.originalName, statusMessages[row.status].title);

export type { CsvImportMeta, CsvImportTaskHandlers };
export {
  TERMINAL_IMPORT_STATUSES,
  isTerminalImportStatus,
  buildTaskLabel,
  buildHydrationLabel,
  computeProgressFromRow,
  handleCsvImportSocketEvent,
};
