import { TemplatesDataSource } from '#api/core/application/contracts/TemplatesDataSource.js';
import { SettingsDataSource } from '#api/core/application/contracts/SettingsDataSource.js';
import { LanguageISO6391 } from '#shared/types/commonTypes.js';
import { NonRetryableJobError } from '#api/core/libs/queue/infrastructure/errors.js';
import { CsvHeaderAnalyzer, AnalyzerOptions } from '../services/CsvHeaderAnalyzer.js';
import { CsvImportsDataSource } from '../contracts/CsvImportsDataSource.js';
import { CsvImportRowsDataSource } from '../contracts/CsvImportRowsDataSource.js';
import { CsvEntitiesImportMapper } from '../services/CsvEntitiesImportMapper.js';
import { ImportContext } from './CsvImportEntitiesTypes.js';

type Deps = {
  csvImportsDS: CsvImportsDataSource;
  rowsDS: CsvImportRowsDataSource;
  templatesDS: TemplatesDataSource;
  settingsDS: SettingsDataSource;
  mapper: CsvEntitiesImportMapper;
};

const loadCsvImportEntitiesContext = async (
  deps: Deps,
  importId: string
): Promise<ImportContext> => {
  const csvImport = (await deps.csvImportsDS.getById(importId)).getDataOrThrow();
  const template = (await deps.templatesDS.getById(csvImport.templateId)).getDataOrThrow();
  const [
    availableLanguages,
    defaultLanguage,
    settings,
    totalRows,
    firstStagedRows,
    thesaurusIndex,
    relationshipIndex,
  ] = await Promise.all([
    deps.settingsDS.getLanguageKeys(),
    deps.settingsDS.getDefaultLanguageKey(),
    deps.settingsDS.get(),
    deps.rowsDS.countByImport(importId),
    deps.rowsDS.getByImport(importId, 0, 1),
    deps.mapper.buildAppliedValuesIndex(importId),
    deps.mapper.buildRelationshipValuesIndex(importId),
  ]);
  if (!totalRows || !firstStagedRows.length) {
    throw new NonRetryableJobError(new Error(`No staged rows found for import ${importId}`));
  }

  const [firstStagedRow] = firstStagedRows;
  const analyzerOptions: AnalyzerOptions = {
    availableLanguages,
    defaultLanguage,
    newNameGeneration: Boolean(settings?.newNameGeneration),
  };

  return {
    csvImport,
    template,
    languages: availableLanguages.map((lang: string): LanguageISO6391 => lang as LanguageISO6391),
    defaultLanguage: defaultLanguage as LanguageISO6391,
    dateFormat: settings?.dateFormat,
    totalRows,
    thesaurusIndex,
    relationshipIndex,
    sanitizedHeaders: CsvEntitiesImportMapper.sanitizeHeaders(
      firstStagedRow.headers,
      analyzerOptions.newNameGeneration
    ),
    headerAnalysis: CsvHeaderAnalyzer.analyze(firstStagedRow.headers, template, analyzerOptions),
  };
};

export { loadCsvImportEntitiesContext };
