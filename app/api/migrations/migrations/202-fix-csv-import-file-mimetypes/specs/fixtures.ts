import { ObjectId } from 'mongodb';
import { DBFixture } from '#api/utils/testing_db.js';

const importWithRowsId = new ObjectId();
const importExtractionOnlyId = new ObjectId();

const csvImportedPdf = new ObjectId();
const csvImportedExtraA = new ObjectId();
const csvImportedDocx = new ObjectId();
const csvImportedLangPdf = new ObjectId();
const extractionOnlyPdf = new ObjectId();
const unusedZipFile = new ObjectId();
const unrelatedHtmlLabeledPdf = new ObjectId();
const alreadyCorrectPdf = new ObjectId();
const urlAttachmentPdf = new ObjectId();
const csvImportedHtml = new ObjectId();
const customUploadPdf = new ObjectId();

const fixtures: DBFixture = {
  csv_imports: [
    {
      _id: importWithRowsId,
      templateId: 'template1',
      file: { originalName: 'upload.zip', mimeType: 'application/zip', size: 10 },
      status: 'completed',
      createdBy: 'user1',
      createdAt: 1,
      updatedAt: 1,
      extraction: {
        sourceType: 'zip',
        originalUploadSizeBytes: 10,
        extractedFilesCount: 5,
        files: [
          { filename: 'import.csv', sizeBytes: 1 },
          { filename: 'report.pdf', sizeBytes: 2 },
          { filename: 'extra-a.pdf', sizeBytes: 2 },
          { filename: 'notes.docx', sizeBytes: 2 },
          { filename: 'unused-in-zip.pdf', sizeBytes: 2 },
        ],
      },
    },
    {
      _id: importExtractionOnlyId,
      templateId: 'template1',
      file: { originalName: 'upload.zip', mimeType: 'application/zip', size: 10 },
      status: 'completed',
      createdBy: 'user1',
      createdAt: 1,
      updatedAt: 1,
      extraction: {
        sourceType: 'zip',
        originalUploadSizeBytes: 10,
        extractedFilesCount: 2,
        files: [
          { filename: 'import.csv', sizeBytes: 1 },
          { filename: 'legacy.pdf', sizeBytes: 2 },
        ],
      },
    },
  ],
  csv_import_rows: [
    {
      importId: importWithRowsId.toString(),
      rowIndex: 0,
      headers: ['title', 'file', 'files', 'attachments'],
      values: ['Entity 1', 'report.pdf', 'extra-a.pdf', 'notes.docx|page.html'],
    },
    {
      importId: importWithRowsId.toString(),
      rowIndex: 1,
      headers: ['title', 'file__en', 'file__es'],
      values: ['Entity 2', 'lang-en.pdf', 'lang-es.pdf'],
    },
  ],
  files: [
    {
      _id: csvImportedPdf,
      type: 'document',
      entity: 'entity-1',
      originalname: 'report.pdf',
      filename: 'stored-report.pdf',
      mimetype: 'text/html',
      status: 'ready',
    },
    {
      _id: csvImportedExtraA,
      type: 'document',
      entity: 'entity-1',
      originalname: 'extra-a.pdf',
      filename: 'stored-extra-a.pdf',
      mimetype: 'text/html',
      status: 'processing',
    },
    {
      _id: csvImportedDocx,
      type: 'attachment',
      entity: 'entity-1',
      originalname: 'notes.docx',
      filename: 'stored-notes.docx',
      mimetype: 'text/html',
    },
    {
      _id: csvImportedLangPdf,
      type: 'document',
      entity: 'entity-2',
      originalname: 'lang-en.pdf',
      filename: 'stored-lang-en.pdf',
      mimetype: 'text/html',
    },
    {
      _id: extractionOnlyPdf,
      type: 'document',
      entity: 'entity-legacy',
      originalname: 'legacy.pdf',
      filename: 'stored-legacy.pdf',
      mimetype: 'text/html',
    },
    {
      _id: unusedZipFile,
      type: 'document',
      entity: 'entity-other',
      originalname: 'unused-in-zip.pdf',
      filename: 'stored-unused.pdf',
      mimetype: 'text/html',
    },
    {
      _id: unrelatedHtmlLabeledPdf,
      type: 'document',
      entity: 'entity-unrelated',
      originalname: 'not-from-csv.pdf',
      filename: 'stored-unrelated.pdf',
      mimetype: 'text/html',
    },
    {
      _id: alreadyCorrectPdf,
      type: 'document',
      entity: 'entity-correct',
      originalname: 'report.pdf',
      filename: 'stored-correct.pdf',
      mimetype: 'application/pdf',
    },
    {
      _id: urlAttachmentPdf,
      type: 'attachment',
      entity: 'entity-url',
      originalname: 'report.pdf',
      filename: 'https://example.com/report.pdf',
      url: 'https://example.com/report.pdf',
      mimetype: 'text/html',
    },
    {
      _id: csvImportedHtml,
      type: 'attachment',
      entity: 'entity-1',
      originalname: 'page.html',
      filename: 'stored-page.html',
      mimetype: 'text/html',
    },
    {
      _id: customUploadPdf,
      type: 'custom',
      originalname: 'report.pdf',
      filename: 'stored-custom.pdf',
      mimetype: 'text/html',
    },
  ],
};

export {
  fixtures,
  csvImportedPdf,
  csvImportedExtraA,
  csvImportedDocx,
  csvImportedLangPdf,
  extractionOnlyPdf,
  unusedZipFile,
  unrelatedHtmlLabeledPdf,
  alreadyCorrectPdf,
  urlAttachmentPdf,
  csvImportedHtml,
  customUploadPdf,
};
