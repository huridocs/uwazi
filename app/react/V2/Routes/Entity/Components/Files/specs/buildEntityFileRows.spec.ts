import { buildEntityFileRows } from '../buildEntityFileRows.js';
import type { Entity } from '#V2/api/entities/types.js';
import type { ClientTemplateSchema } from '#V2/shared/types.js';

describe('buildEntityFileRows', () => {
  const templates = [
    {
      _id: 'template-1',
      name: 'Template',
      properties: [],
    },
  ] as ClientTemplateSchema[];

  it('should split files by category and detect active main document', () => {
    const entity = {
      sharedId: 'entity-1',
      template: 'template-1',
      documents: [
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
      attachments: [
        {
          _id: 'att-1',
          filename: 'audio.mp3',
          originalname: 'Audio',
          mimetype: 'audio/mpeg',
          size: 200,
          creationDate: 1720000020,
        },
      ],
      metadata: {},
    } as Entity;

    const result = buildEntityFileRows(entity, templates, 'en', 'en');

    expect(result.primaryRows).toHaveLength(2);
    expect(result.supportingRows).toHaveLength(1);
    expect(result.mainDocumentId).toBe('doc-en');
  });

  it('should map stable kinds and type labels to design kinds', () => {
    const entity = {
      sharedId: 'entity-2',
      template: 'template-1',
      documents: [
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
      attachments: [
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
      ],
      metadata: {},
    } as Entity;

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
    const entity = {
      sharedId: 'entity-3',
      template: 'template-1',
      documents: [
        {
          _id: 'pdf-filename',
          filename: 'judgment.pdf',
          originalname: 'Judgment',
          language: 'en',
          size: 100,
          creationDate: 1720000000,
        },
      ],
      attachments: [
        {
          _id: 'unused',
          filename: 'notes.txt',
          originalname: 'Notes',
          mimetype: 'text/plain',
          size: 10,
          creationDate: 1720000001,
        },
      ],
      metadata: {},
    } as Entity;

    const result = buildEntityFileRows(entity, templates, 'en', 'en');

    expect(result.primaryRows[0]?.kind).toBe('pdf');
    expect(result.primaryRows[0]?.typeLabel).toBe('PDF');
  });

  it('should surface document processing status on rows', () => {
    const entity = {
      sharedId: 'entity-4',
      template: 'template-1',
      documents: [
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
      ],
      attachments: [],
      metadata: {},
    } as unknown as Entity;

    const result = buildEntityFileRows(entity, templates, 'en', 'en');

    expect(result.primaryRows.find(row => row.rowId === 'processing-doc')?.status).toBe(
      'processing'
    );
    expect(result.primaryRows.find(row => row.rowId === 'failed-doc')?.status).toBe('failed');
  });
});
