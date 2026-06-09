import { buildEntityFileRows } from '../buildEntityFileRows.js';

describe('buildEntityFileRows', () => {
  it('should split files by category and detect active main document', () => {
    const entity: any = {
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
    };

    const templates: any = [
      {
        _id: 'template-1',
        properties: [],
      },
    ];

    const result = buildEntityFileRows(entity, templates, 'en', 'en');

    expect(result.primaryRows).toHaveLength(2);
    expect(result.supportingRows).toHaveLength(1);
    expect(result.mainDocumentId).toBe('doc-en');
  });
});
