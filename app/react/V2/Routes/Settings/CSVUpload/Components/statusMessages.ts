import { t } from '#app/I18N/index.js';
import { CsvImportStatus } from '#app/V2/api/csv/index.js';

type StatusMessage = {
  title: string;
  description: string;
};

const statusMessages = {
  [CsvImportStatus.Queued]: {
    title: t('System', 'Queued', null, false),
    description: t('System', 'This import is waiting in queue.', null, false),
  },
  [CsvImportStatus.Validating]: {
    title: t('System', 'Validating', null, false),
    description: t('System', 'Validating file structure and headers.', null, false),
  },
  [CsvImportStatus.ExtractingFiles]: {
    title: t('System', 'Extracting files', null, false),
    description: t('System', 'Extracting files from uploaded package.', null, false),
  },
  [CsvImportStatus.ExtractingFilesDone]: {
    title: t('System', 'Done extracting files', null, false),
    description: t('System', 'File extraction completed successfully.', null, false),
  },
  [CsvImportStatus.PreflightScan]: {
    title: t('System', 'Scanning', null, false),
    description: t('System', 'Scanning rows before import.', null, false),
  },
  [CsvImportStatus.PreflightScanDone]: {
    title: t('System', 'Done scanning', null, false),
    description: t('System', 'Preflight scan completed.', null, false),
  },
  [CsvImportStatus.PreflightThesauriCreate]: {
    title: t('System', 'Creating thesauri', null, false),
    description: t('System', 'Preparing required thesauri values.', null, false),
  },
  [CsvImportStatus.PreflightThesauriCreateDone]: {
    title: t('System', 'Done creating thesauri', null, false),
    description: t('System', 'Required thesauri values were prepared.', null, false),
  },
  [CsvImportStatus.PreflightRelationshipsCreate]: {
    title: t('System', 'Creating relationships', null, false),
    description: t('System', 'Preparing required relationships.', null, false),
  },
  [CsvImportStatus.PreflightRelationshipsCreateDone]: {
    title: t('System', 'Done creating relationships', null, false),
    description: t('System', 'Required relationships were prepared.', null, false),
  },
  [CsvImportStatus.ImportEntities]: {
    title: t('System', 'Creating entities', null, false),
    description: t('System', 'Import is currently processing rows.', null, false),
  },
  [CsvImportStatus.ImportEntitiesDone]: {
    title: t('System', 'Done creating entities', null, false),
    description: t('System', 'Entity creation stage completed.', null, false),
  },
  [CsvImportStatus.Retrying]: {
    title: t('System', 'Retrying', null, false),
    description: t('System', 'Import is retrying after an error.', null, false),
  },
  [CsvImportStatus.Processing]: {
    title: t('System', 'Processing', null, false),
    description: t('System', 'Import is currently processing rows.', null, false),
  },
  [CsvImportStatus.Completed]: {
    title: t('System', 'Completed', null, false),
    description: t('System', 'Import finished successfully.', null, false),
  },
  [CsvImportStatus.Failed]: {
    title: t('System', 'Failed', null, false),
    description: t('System', 'Import failed. Review details below.', null, false),
  },
  [CsvImportStatus.Cancelled]: {
    title: t('System', 'Cancelled', null, false),
    description: t('System', 'Import was cancelled.', null, false),
  },
  completedWithErrors: {
    title: t('System', 'Completed with errors', null, false),
    description: t('System', 'Import finished with errors. Review details below.', null, false),
  },
} as const satisfies Record<CsvImportStatus | 'completedWithErrors', StatusMessage>;

export { statusMessages };
