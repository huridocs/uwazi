import type { Template } from '#app/apiResponseTypes.js';
import { ClientTranslationSchema } from '#app/istore.js';
import { CsvImportStatus } from '#V2/api/csv/index.js';
import type { CsvImportListRow } from '#V2/api/csv/index.js';

const csvImportsList: CsvImportListRow[] = [
  {
    id: 'csv-import-1',
    status: CsvImportStatus.Queued,
    templateId: 'template-people',
    file: {
      originalName: 'people.csv',
      mimeType: 'text/csv',
      size: 24576,
    },
    createdAt: 1712496000000,
    updatedAt: 1712496000000,
  },
  {
    id: 'csv-import-2',
    status: CsvImportStatus.Processing,
    templateId: 'template-cases',
    file: {
      originalName: 'cases.zip',
      mimeType: 'application/zip',
      size: 132481,
    },
    createdAt: 1712582400000,
    updatedAt: 1712582700000,
    progress: {
      totalRows: 120,
      processedRows: 48,
      lastProcessedRow: 48,
      batchSize: 25,
    },
    stats: {
      entitiesCreated: 44,
      rowsProcessed: 48,
      rowsFailed: 1,
    },
    extraction: {
      sourceType: 'zip',
      originalUploadSizeBytes: 132481,
      extractedFilesCount: 3,
      totalFilesInZip: 3,
      files: [
        {
          filename: 'cases.csv',
          sizeBytes: 58124,
          compressedSizeBytes: 14672,
        },
        {
          filename: 'sources.csv',
          sizeBytes: 19012,
          compressedSizeBytes: 5401,
        },
        {
          filename: 'metadata.json',
          sizeBytes: 312,
          compressedSizeBytes: 204,
        },
      ],
    },
  },
  {
    id: 'csv-import-3',
    status: CsvImportStatus.Completed,
    templateId: 'template-events',
    file: {
      originalName: 'events.csv',
      mimeType: 'text/csv',
      size: 88912,
    },
    createdAt: 1712668800000,
    updatedAt: 1712669400000,
    progress: {
      totalRows: 86,
      processedRows: 86,
      lastProcessedRow: 86,
      batchSize: 50,
    },
    stats: {
      thesaurusValuesObserved: 18,
      thesaurusValuesCreated: 4,
      thesauriTouched: 2,
      relationshipValuesObserved: 9,
      relationshipValuesCreated: 3,
      entitiesCreated: 84,
      rowsProcessed: 86,
      rowsFailed: 0,
    },
    extraction: {
      sourceType: 'csv',
      originalUploadSizeBytes: 88912,
      extractedFilesCount: 1,
      files: [
        {
          filename: 'events.csv',
          sizeBytes: 88912,
        },
      ],
    },
  },
  {
    id: 'csv-import-4',
    status: CsvImportStatus.Failed,
    templateId: 'template-documents',
    file: {
      originalName: 'documents.csv',
      mimeType: 'text/csv',
      size: 43711,
    },
    createdAt: 1712755200000,
    updatedAt: 1712755500000,
    progress: {
      totalRows: 60,
      processedRows: 17,
      lastProcessedRow: 18,
      batchSize: 20,
    },
    stats: {
      entitiesCreated: 15,
      rowsProcessed: 17,
      rowsFailed: 2,
    },
    failure: {
      message: 'Template validation failed for row 18',
      retryable: true,
      at: 1712755500000,
      stage: 'validation',
      code: 'invalid_template_value',
    },
  },
];

const templates: Template[] = [
  {
    _id: 'template-people',
    name: 'People',
    color: '#1D4ED8',
  },
  {
    _id: 'template-cases',
    name: 'Cases',
    color: '#B45309',
  },
  {
    _id: 'template-events',
    name: 'Events',
    color: '#047857',
  },
  {
    _id: 'template-documents',
    name: 'Documents',
    color: '#7C3AED',
  },
];

const translations: ClientTranslationSchema[] = [
  {
    locale: 'en',
    contexts: [
      { id: 'template-people', values: { People: 'People' } },
      { id: 'template-cases', values: { Cases: 'Cases' } },
      { id: 'template-events', values: { Events: 'Events' } },
      { id: 'template-documents', values: { Documents: 'Documents' } },
    ],
  },
  {
    locale: 'es',
    contexts: [
      { id: 'template-people', values: { People: 'Personas' } },
      { id: 'template-cases', values: { Cases: 'Casos' } },
      { id: 'template-events', values: { Events: 'Eventos' } },
      { id: 'template-documents', values: { Documents: 'Documentos' } },
    ],
  },
];

export { csvImportsList, templates, translations };
