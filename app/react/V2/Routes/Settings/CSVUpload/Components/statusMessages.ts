import { t } from '#app/I18N/index.js';
import { CsvImportStatus } from '#app/V2/api/csv/index.js';

const statusMessages = {
  [CsvImportStatus.Queued]: t('System', 'Queued', null, false),
  [CsvImportStatus.Validating]: t('System', 'Validating', null, false),
  [CsvImportStatus.ExtractingFiles]: t('System', 'Extracting files', null, false),
  [CsvImportStatus.ExtractingFilesDone]: t('System', 'Done extracting files', null, false),
  [CsvImportStatus.PreflightScan]: t('System', 'Scanning', null, false),
  [CsvImportStatus.PreflightScanDone]: t('System', 'Done scanning', null, false),
  [CsvImportStatus.PreflightThesauriCreate]: t('System', 'Creating thesauri', null, false),
  [CsvImportStatus.PreflightThesauriCreateDone]: t('System', 'Done creating thesauri', null, false),
  [CsvImportStatus.PreflightRelationshipsCreate]: t(
    'System',
    'Creating relationships',
    null,
    false
  ),
  [CsvImportStatus.PreflightRelationshipsCreateDone]: t(
    'System',
    'Done creating relationships',
    null,
    false
  ),
  [CsvImportStatus.ImportEntities]: t('System', 'Creatin entities', null, false),
  [CsvImportStatus.ImportEntitiesDone]: t('System', 'Done creating entities', null, false),
  [CsvImportStatus.Retrying]: t('System', 'Retrying', null, false),
  [CsvImportStatus.Processing]: t('System', 'Processing', null, false),
  [CsvImportStatus.Completed]: t('System', 'Completed', null, false),
  [CsvImportStatus.Failed]: t('System', 'Failed', null, false),
  [CsvImportStatus.Cancelled]: t('System', 'Cancelled', null, false),
};

export { statusMessages };
