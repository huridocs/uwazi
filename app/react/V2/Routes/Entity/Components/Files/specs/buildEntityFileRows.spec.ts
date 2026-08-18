import { buildEntityFileRows } from '../buildEntityFileRows.js';
import type { Entity, FileType } from '#V2/api/entities/types.js';
import type { ClientTemplateSchema } from '#V2/shared/types.js';

const templates: ClientTemplateSchema[] = [
  {
    _id: 'template-1',
    name: 'Template',
    properties: [],
  },
];

const entityFixture = (
  sharedId: string,
  documents: FileType[],
  attachments: FileType[] = []
): Entity => ({
  _id: sharedId,
  sharedId,
  language: 'en',
  title: 'Entity',
  template: 'template-1',
  creationDate: 1,
  user: 'user-1',
  documents,
  attachments,
  metadata: {},
});

describe('buildEntityFileRows', () => {
  it('should split files by category and detect active main document', () => {
    const entity = entityFixture(
      'entity-1',
      [
        {
          _id: 'doc-en',
          filename: 'doc-en.pdf',
          originalname: 'English file',
          language: 'en',
          mimetype: 'application/pdf',
          size: 1024,
          creationDate: 1720000000,
        },
        {
          _id: 'doc-es',
          filename: 'doc-es.pdf',
          originalname: 'Spanish file',
          language: 'es',
          mimetype: 'application/pdf',
          size: 2048,
          creationDate: 1720000010,
        },
      ],
      [
        {
          _id: 'att-1',
          filename: 'audio.mp3',
          originalname: 'Audio',
          mimetype: 'audio/mpeg',
          size: 200,
          creationDate: 1720000020,
        },
      ]
    );

    const result = buildEntityFileRows(entity, templates, 'en', 'en');

    expect(result.primaryRows).toHaveLength(2);
    expect(result.supportingRows).toHaveLength(1);
    expect(result.mainDocumentId).toBe('doc-en');
  });

  it('should label file languages with the UI-locale name and ISO code', () => {
    const entity = entityFixture('entity-lang', [
      {
        _id: 'doc-en',
        filename: 'doc-en.pdf',
        originalname: 'English file',
        language: 'eng',
        mimetype: 'application/pdf',
        size: 1024,
        creationDate: 1720000000,
      },
      {
        _id: 'doc-es',
        filename: 'doc-es.pdf',
        originalname: 'Spanish file',
        language: 'spa',
        mimetype: 'application/pdf',
        size: 2048,
        creationDate: 1720000010,
      },
    ]);

    const result = buildEntityFileRows(entity, templates, 'es', 'en');
    const byId = Object.fromEntries(result.primaryRows.map(row => [row.rowId, row]));

    expect(byId['doc-en']?.languageKey).toBe('Inglés - EN');
    expect(byId['doc-es']?.languageKey).toBe('Español - ES');
  });

  it('should map stable kinds and type labels to design kinds', () => {
    const entity = entityFixture(
      'entity-2',
      [
        {
          _id: 'pdf-1',
          filename: 'doc.pdf',
          originalname: 'PDF file',
          language: 'en',
          mimetype: 'application/pdf',
          size: 100,
          creationDate: 1720000000,
        },
      ],
      [
        {
          _id: 'audio-1',
          filename: 'clip.mp3',
          originalname: 'Audio file',
          mimetype: 'audio/mpeg',
          size: 100,
          creationDate: 1720000001,
        },
        {
          _id: 'video-1',
          filename: 'clip.mp4',
          originalname: 'Video file',
          mimetype: 'video/mp4',
          size: 100,
          creationDate: 1720000002,
        },
        {
          _id: 'image-1',
          filename: 'photo.png',
          originalname: 'Image file',
          mimetype: 'image/png',
          size: 100,
          creationDate: 1720000003,
        },
        {
          _id: 'link-1',
          url: 'https://example.com/resource',
          originalname: 'External link',
          size: 0,
          creationDate: 1720000004,
        },
        {
          _id: 'doc-1',
          filename: 'notes.docx',
          originalname: 'Word doc',
          mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          size: 100,
          creationDate: 1720000005,
        },
      ]
    );

    const result = buildEntityFileRows(entity, templates, 'en', 'en');
    const byId = Object.fromEntries(
      [...result.primaryRows, ...result.supportingRows].map(row => [row.rowId, row])
    );

    expect(result.primaryRows[0]).toMatchObject({ kind: 'pdf', typeLabel: 'PDF' });
    expect(byId['audio-1']?.kind).toBe('audio');
    expect(byId['video-1']?.kind).toBe('video');
    expect(byId['image-1']?.kind).toBe('image');
    expect(byId['link-1']?.kind).toBe('link');
    expect(byId['doc-1']?.kind).toBe('document');
  });

  it('should resolve pdf kind from filename when mimetype is missing', () => {
    const entity = entityFixture(
      'entity-3',
      [
        {
          _id: 'pdf-filename',
          filename: 'judgment.pdf',
          originalname: 'Judgment',
          language: 'en',
          size: 100,
          creationDate: 1720000000,
        },
      ],
      [
        {
          _id: 'unused',
          filename: 'notes.txt',
          originalname: 'Notes',
          mimetype: 'text/plain',
          size: 10,
          creationDate: 1720000001,
        },
      ]
    );

    const result = buildEntityFileRows(entity, templates, 'en', 'en');

    expect(result.primaryRows[0]?.kind).toBe('pdf');
    expect(result.primaryRows[0]?.typeLabel).toBe('PDF');
  });

  it('should surface document processing status on rows', () => {
    const entity = entityFixture('entity-4', [
      {
        _id: 'processing-doc',
        filename: 'new.pdf',
        originalname: 'New PDF',
        language: 'eng',
        mimetype: 'application/pdf',
        size: 100,
        creationDate: 1720000000,
        status: 'processing',
      },
      {
        _id: 'failed-doc',
        filename: 'bad.pdf',
        originalname: 'Bad PDF',
        language: 'eng',
        mimetype: 'application/pdf',
        size: 100,
        creationDate: 1720000001,
        status: 'failed',
      },
    ]);

    const result = buildEntityFileRows(entity, templates, 'en', 'en');

    expect(result.primaryRows.find(row => row.rowId === 'processing-doc')?.status).toBe(
      'processing'
    );
    expect(result.primaryRows.find(row => row.rowId === 'failed-doc')?.status).toBe('failed');
  });

  it('should pick ready or legacy missing-status docs as mainDocumentId', () => {
    const entity = entityFixture('entity-5', [
      {
        _id: 'processing-doc',
        filename: 'busy.pdf',
        originalname: 'Busy',
        language: 'eng',
        mimetype: 'application/pdf',
        status: 'processing',
      },
      {
        _id: 'legacy-doc',
        filename: 'legacy.pdf',
        originalname: 'Legacy',
        language: 'eng',
        mimetype: 'application/pdf',
      },
    ]);

    const result = buildEntityFileRows(entity, templates, 'en', 'en');

    expect(result.mainDocumentId).toBe('legacy-doc');
    expect(result.primaryRows.find(row => row.rowId === 'legacy-doc')?.fileType).toBe(
      'mainDocument'
    );
    expect(result.primaryRows.find(row => row.rowId === 'processing-doc')?.fileType).toBe(
      'document'
    );
  });
});
