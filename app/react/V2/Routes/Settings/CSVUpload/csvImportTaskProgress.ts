import { t } from '#app/I18N/index.js';
import { csvImportEvents } from '#V2/api/csv/events.js';
import type { CsvImportEventPayloads } from '#V2/api/csv/events.js';
import { CsvImportStatus, type CsvImportListRow } from '#V2/api/csv/index.js';
import { statusMessages } from './Components/statusMessages.js';

type CsvImportTaskHandlers = {
  ensureTask: (importId: string, label: string, progress?: number) => void;
  updateTask: (importId: string, updates: { label?: string; progress?: number }) => void;
  completeTask: (importId: string) => void;
  failTask: (importId: string) => void;
  notifySuccess: (fileName?: string) => void;
  notifyError: (fileName: string | undefined, message: string) => void;
  notifyCancelled: (fileName?: string) => void;
};

const TERMINAL_IMPORT_STATUSES = new Set<CsvImportStatus>([
  CsvImportStatus.Completed,
  CsvImportStatus.Failed,
  CsvImportStatus.Cancelled,
]);

/** Statuses where pipeline work is still in progress (show as running task). */
const ACTIVE_IMPORT_STATUSES = new Set<CsvImportStatus>([
  CsvImportStatus.Queued,
  CsvImportStatus.Validating,
  CsvImportStatus.ExtractingFiles,
  CsvImportStatus.PreflightScan,
  CsvImportStatus.PreflightThesauriCreate,
  CsvImportStatus.PreflightRelationshipsCreate,
  CsvImportStatus.ImportEntities,
  CsvImportStatus.Retrying,
  CsvImportStatus.Processing,
]);

const isTerminalImportStatus = (status: CsvImportStatus) => TERMINAL_IMPORT_STATUSES.has(status);

const isActiveImportForTask = (status: CsvImportStatus) => ACTIVE_IMPORT_STATUSES.has(status);

/** Import finished a stage or the whole pipeline — do not show as a new running task on hydrate. */
const shouldCloseTaskForImportStatus = (status: CsvImportStatus) =>
  isTerminalImportStatus(status) || !isActiveImportForTask(status);

const FILE_SUFFIX_SEPARATOR = ' — ';

const buildTaskLabel = (stageTitle: string, fileName?: string) => {
  const prefix = t('System', 'CSV Import', null, false);
  if (fileName) {
    return `${prefix}: ${stageTitle}${FILE_SUFFIX_SEPARATOR}${fileName}`;
  }
  return `${prefix}: ${stageTitle}`;
};

/** Keeps the file name from an existing task label when socket events only send a stage title. */
const mergeTaskLabel = (existingLabel: string | undefined, nextLabel: string) => {
  if (!existingLabel) {
    return nextLabel;
  }
  const suffixMatch = existingLabel.match(/ — (.+)$/);
  if (suffixMatch && !nextLabel.includes(FILE_SUFFIX_SEPARATOR)) {
    return `${nextLabel}${FILE_SUFFIX_SEPARATOR}${suffixMatch[1]}`;
  }
  return nextLabel;
};

const fileNameFromTaskLabel = (label: string | undefined) => label?.match(/ — (.+)$/)?.[1];

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
      return statusMessages[CsvImportStatus.PreflightScan].title;
    case csvImportEvents.preflightScanStart:
      return statusMessages[CsvImportStatus.PreflightScan].title;
    case csvImportEvents.preflightScanSuccess:
      return statusMessages[CsvImportStatus.PreflightThesauriCreate].title;
    case csvImportEvents.preflightThesauriCreateStart:
      return statusMessages[CsvImportStatus.PreflightThesauriCreate].title;
    case csvImportEvents.preflightThesauriCreateSuccess:
      return statusMessages[CsvImportStatus.PreflightRelationshipsCreate].title;
    case csvImportEvents.preflightRelationshipsCreateStart:
      return statusMessages[CsvImportStatus.PreflightRelationshipsCreate].title;
    case csvImportEvents.preflightRelationshipsCreateSuccess:
      return statusMessages[CsvImportStatus.ImportEntities].title;
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

const handleCsvImportSocketEvent = (
  event: string,
  payload: CsvImportEventPayloads[keyof CsvImportEventPayloads],
  handlers: CsvImportTaskHandlers
) => {
  const importId = payload.importId;

  if (event === csvImportEvents.importCancelled) {
    const label = buildTaskLabel(statusMessages[CsvImportStatus.Cancelled].title);
    handlers.ensureTask(importId, label);
    handlers.updateTask(importId, { label });
    handlers.completeTask(importId);
    handlers.notifyCancelled();
    return;
  }

  if (event.endsWith(':error')) {
    const message = 'message' in payload ? payload.message : '';
    const label = buildTaskLabel(statusMessages[CsvImportStatus.Failed].title);
    handlers.ensureTask(importId, label);
    handlers.failTask(importId);
    handlers.notifyError(undefined, message);
    return;
  }

  if (event === csvImportEvents.importSuccess) {
    const label = buildTaskLabel(statusMessages[CsvImportStatus.Completed].title);
    handlers.ensureTask(importId, label, 100);
    handlers.completeTask(importId);
    handlers.notifySuccess();
    return;
  }

  const stageTitle = getStageTitleForEvent(event);
  const label = buildTaskLabel(stageTitle);
  const progress = computeProgressFromPayload(event, payload);
  handlers.ensureTask(importId, label, progress);
};

const buildHydrationLabel = (row: CsvImportListRow) =>
  buildTaskLabel(statusMessages[row.status].title, row.file.originalName);

export type { CsvImportTaskHandlers };
export {
  TERMINAL_IMPORT_STATUSES,
  ACTIVE_IMPORT_STATUSES,
  isTerminalImportStatus,
  isActiveImportForTask,
  shouldCloseTaskForImportStatus,
  buildTaskLabel,
  mergeTaskLabel,
  fileNameFromTaskLabel,
  buildHydrationLabel,
  computeProgressFromRow,
  handleCsvImportSocketEvent,
};
