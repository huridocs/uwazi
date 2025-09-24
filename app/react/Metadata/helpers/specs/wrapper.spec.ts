/**
 * @jest-environment jsdom
 */
import fetchMock from 'fetch-mock';
import { ClientTemplateSchema } from 'app/istore';
import { wrapEntityMetadata, prepareMetadataAndFiles } from '../wrapper';

describe('wrapEntityMetadata', () => {
  const template = {
    _id: 'template1',
    properties: [
      { name: 'text', type: 'text' },
      { name: 'image', type: 'image' },
      { name: 'media1', type: 'media' },
      { name: 'media2', type: 'media' },
      { name: 'media3', type: 'media' },
    ],
  };
  it('should return entity as is if there is no metadata', () => {
    const entity = { title: 'title', template: 'template1' };
    const wrappedEntity = wrapEntityMetadata(entity, template);
    expect(wrappedEntity).toEqual(entity);
  });
  it('should return correct entity metadata with linked attachments to metadata fields', () => {
    const entity = {
      title: 'A title',
      metadata: { text: 'Texto 1', image: 'k3rutmyxrdr' },
      attachments: [
        {
          originalname: 'document.pdf',
          filename: 'Document',
          type: 'file',
          fileLocalID: 'x45jncashdf',
        },
        {
          originalname: 'image.jpeg',
          filename: 'Image',
          type: 'attachment',
          mimetype: 'image/jpeg',
          fileLocalID: 'k3rutmyxrdr',
        },
      ],
    };
    const wrappedEntity = wrapEntityMetadata(entity, template);
    expect(wrappedEntity).toEqual({
      title: 'A title',
      metadata: { text: [{ value: 'Texto 1' }], image: [{ value: '', attachment: 1 }] },
      attachments: [
        {
          originalname: 'document.pdf',
          filename: 'Document',
          type: 'file',
          fileLocalID: 'x45jncashdf',
        },
        {
          originalname: 'image.jpeg',
          filename: 'Image',
          type: 'attachment',
          mimetype: 'image/jpeg',
          fileLocalID: 'k3rutmyxrdr',
        },
      ],
    });
  });

  it('should return correct entity metadata with timelinks', () => {
    const entity = {
      title: 'A title',
      metadata: {
        media1:
          '(/api/files/1681177668034i5lntk7hak.mp4, {"timelinks":{"00:00:13":"Check point 1","00:00:27":"Check point 2"}})',
        media2: '(9032yptqzo5, {"timelinks":{"00:00:09":"Check point 1"}})',
        media3: '(https://youtu.be/f8eUd9BaTsI, {"timelinks":{"00:21:59":""}})',
        multidate: [1681257600, 1682121600, 1682467200],
      },
      attachments: [
        {
          filename: '1681177668034i5lntk7hak.mp4',
          mimetype: 'video/mp4',
          originalname: 'SunsetWavesMediumOriginal.mp4',
          size: 92827254,
          type: 'attachment',
          _id: '6434bc45e6b71f2c150a18d5',
        },
        {
          entity: 'A title',
          fileLocalID: '9032yptqzo5',
          originalname: 'SunsetWavesMedium.mp4',
          filename: 'SunsetWavesMedium.mp4',
          type: 'attachment',
          serializedFile:
            'data:video/mp4;base64,AAAAGGZ0eXBtcDQyAAAAAG1wNDJtcDQxAAA6Nm1vb3YAAABsbXZoZAAAAADR7qsT',
        },
      ],
    };
    const wrappedEntity = wrapEntityMetadata(entity, template);
    expect(wrappedEntity).toEqual({
      title: 'A title',

      metadata: {
        media1: [
          {
            value:
              '(/api/files/1681177668034i5lntk7hak.mp4, {"timelinks":{"00:00:13":"Check point 1","00:00:27":"Check point 2"}})',
          },
        ],
        media2: [
          { attachment: 0, timeLinks: '{"timelinks":{"00:00:09":"Check point 1"}}', value: '' },
        ],
        media3: [
          {
            value: '(https://youtu.be/f8eUd9BaTsI, {"timelinks":{"00:21:59":""}})',
          },
        ],
        multidate: [{ value: 1681257600 }, { value: 1682121600 }, { value: 1682467200 }],
      },
      attachments: [
        {
          filename: '1681177668034i5lntk7hak.mp4',
          mimetype: 'video/mp4',
          originalname: 'SunsetWavesMediumOriginal.mp4',
          size: 92827254,
          type: 'attachment',
          _id: '6434bc45e6b71f2c150a18d5',
        },
        {
          entity: 'A title',
          fileLocalID: '9032yptqzo5',
          originalname: 'SunsetWavesMedium.mp4',
          filename: 'SunsetWavesMedium.mp4',
          type: 'attachment',
          serializedFile:
            'data:video/mp4;base64,AAAAGGZ0eXBtcDQyAAAAAG1wNDJtcDQxAAA6Nm1vb3YAAABsbXZoZAAAAADR7qsT',
        },
      ],
    });
  });
});

describe('prepareMetadataAndFiles', () => {
  let template: ClientTemplateSchema;
  beforeEach(() => {
    template = {
      _id: '5bfbb1a0471dd0fc16ada146',
      name: 'Document',
      commonProperties: [
        {
          _id: '5bfbb1a0471dd0fc16ada148',
          label: 'Title',
          name: 'title',
          type: 'text',
        },
        {
          _id: '5bfbb1a0471dd0fc16ada147',
          label: 'Date added',
          name: 'creationDate',
          type: 'date',
        },
      ],
      properties: [
        {
          _id: '623dced693aad2b835f64a1e',
          label: 'Text',
          type: 'text',
          name: 'text',
        },
        {
          _id: '623dced693aad2b835f64a1e',
          label: 'Image',
          type: 'image',
          name: 'image',
        },
        {
          _id: '6241c23981d322332488e94e',
          label: 'Image 2',
          type: 'image',
          name: 'image_2',
        },
      ],
    };
  });

  it('should return the formatted entity with assigned image property', async () => {
    global.URL.revokeObjectURL = jest.fn();
    const imageFile = new File([Buffer.from('image content').toString('base64')], 'image.jpg');
    const document = new File(
      [Buffer.from('my pdf file content').toString('base64')],
      'Document.pdf'
    );

    const entity = {
      title: 'A title',
      metadata: {
        image_2: {
          data: 'http://image.is',
          originalFile: imageFile,
        },
        image: 'https://an-image-on-the-web',
        text: 'Texto 1',
      },
    };

    fetchMock.mock('http://image.is', {
      body: imageFile,
      status: 200,
      headers: { 'Content-Type': 'some/mimetype' },
    });

    const mediaProperties = template.properties.filter(prop => prop.type === 'image');
    const wrappedEntity = await prepareMetadataAndFiles(
      entity,
      [document],
      template,
      mediaProperties
    );
    expect(wrappedEntity.metadata).toEqual({
      image_2: [
        {
          value: '',
          attachment: 0,
        },
      ],
      image: [
        {
          value: 'https://an-image-on-the-web',
        },
      ],
      text: [
        {
          value: 'Texto 1',
        },
      ],
    });
    expect(wrappedEntity.attachments.length).toBe(2);
    wrappedEntity.attachments.forEach((attachment: File) => {
      expect(attachment).toBeInstanceOf(File);
    });
  });

  it('should process File objects from originalFile field and use blob URL for local rendering', async () => {
    const imageFile = new File(
      [Buffer.from('image content').toString('base64')],
      'test-image.jpg',
      {
        type: 'image/jpeg',
      }
    );

    const entity = {
      title: 'Test Entity',
      metadata: {
        image: {
          data: 'blob:http://localhost:3000/12345678-1234-1234-1234-123456789abc',
          originalFile: imageFile,
        },
      },
    };

    const mediaProperties = template.properties.filter(prop => prop.type === 'image');
    const wrappedEntity = await prepareMetadataAndFiles(entity, [], template, mediaProperties);

    // Should process the File object directly, not the blob URL
    expect(wrappedEntity.metadata).toEqual({
      image: [
        {
          value: '',
          attachment: 0,
        },
      ],
    });

    // Should have the File object in attachments
    expect(wrappedEntity.attachments.length).toBe(1);
    expect(wrappedEntity.attachments[0]).toBeInstanceOf(File);
    expect(wrappedEntity.attachments[0]).toBe(imageFile);
  });

  it('should handle images from URLs without storing a file object', async () => {
    const entity = {
      title: 'Test Entity',
      metadata: {
        image: 'https://example.com/image.jpg',
        image2: 'http://example.com/image2.png',
      },
    };

    const mediaProperties = template.properties.filter(prop => prop.type === 'image');
    const wrappedEntity = await prepareMetadataAndFiles(entity, [], template, mediaProperties);

    expect(wrappedEntity.metadata).toEqual({
      image: [
        {
          value: 'https://example.com/image.jpg',
        },
      ],
      image2: [
        {
          value: 'http://example.com/image2.png',
        },
      ],
    });

    expect(wrappedEntity.attachments.length).toBe(0);
  });

  it('should handle mixed data types: File objects, URLs, and blob URLs', async () => {
    const imageFile = new File(
      [Buffer.from('image content').toString('base64')],
      'test-image.jpg',
      {
        type: 'image/jpeg',
      }
    );

    const entity = {
      title: 'Test Entity',
      metadata: {
        image: {
          data: 'blob:http://localhost:3000/12345678-1234-1234-1234-123456789abc',
          originalFile: imageFile,
        },
        image2: 'https://example.com/image.jpg',
        image3: {
          data: 'blob:http://localhost:3000/87654321-4321-4321-4321-210987654321',
          originalFile: null, // No originalFile, should process blob URL
        },
      },
    };

    fetchMock.mock('blob:http://localhost:3000/87654321-4321-4321-4321-210987654321', {
      body: new Blob(['blob content'], { type: 'image/jpeg' }),
      status: 200,
      headers: { 'Content-Type': 'image/jpeg' },
    });

    const mediaProperties = template.properties.filter(prop => prop.type === 'image');
    const wrappedEntity = await prepareMetadataAndFiles(entity, [], template, mediaProperties);

    // File object should be processed directly
    expect(wrappedEntity.metadata.image).toEqual([
      {
        value: '',
        attachment: 0,
      },
    ]);

    // URL should be preserved
    expect(wrappedEntity.metadata.image2).toEqual([
      {
        value: 'https://example.com/image.jpg',
      },
    ]);

    // Blob URL should be skipped (set to empty)
    expect(wrappedEntity.metadata.image3).toEqual([
      {
        value: '',
      },
    ]);

    // Should have 1 file in attachments (only the File object)
    expect(wrappedEntity.attachments.length).toBe(1);
    expect(wrappedEntity.attachments[0]).toBe(imageFile);
  });

  it('should remove blob URLs from metadata in fallback cleanup while preserving URLs', async () => {
    const entity = {
      title: 'Test Entity',
      metadata: {
        image: 'blob:http://localhost:3000/invalid-blob-url',
        image2: 'https://example.com/valid-image.jpg',
        image3: 'http://example.com/another-valid-image.png',
        text: 'some text value',
      },
    };

    const mediaProperties = template.properties.filter(prop => prop.type === 'image');
    const wrappedEntity = await prepareMetadataAndFiles(entity, [], template, mediaProperties);

    // Blob URL should be skipped (set to empty)
    expect(wrappedEntity.metadata.image).toEqual([
      {
        value: '',
      },
    ]);

    // HTTP/HTTPS URLs should be preserved
    expect(wrappedEntity.metadata.image2).toEqual([
      {
        value: 'https://example.com/valid-image.jpg',
      },
    ]);

    expect(wrappedEntity.metadata.image3).toEqual([
      {
        value: 'http://example.com/another-valid-image.png',
      },
    ]);

    expect(wrappedEntity.metadata.text).toEqual([
      {
        value: 'some text value',
      },
    ]);
  });

  it('should handle empty or invalid file objects gracefully', async () => {
    const entity = {
      title: 'Test Entity',
      metadata: {
        image: {
          data: 'blob:http://localhost:3000/12345678-1234-1234-1234-123456789abc',
          originalFile: null, // Invalid originalFile
        },
        image2: {
          data: 'blob:http://localhost:3000/87654321-4321-4321-4321-210987654321',
          originalFile: undefined, // Invalid originalFile
        },
      },
    };

    // Mock fetch for blob URL processing
    fetchMock.reset();
    fetchMock.mock('blob:http://localhost:3000/12345678-1234-1234-1234-123456789abc', {
      body: new Blob(['blob content'], { type: 'image/jpeg' }),
      status: 200,
      headers: { 'Content-Type': 'image/jpeg' },
    });

    fetchMock.mock('blob:http://localhost:3000/87654321-4321-4321-4321-210987654321', {
      body: new Blob(['blob content 2'], { type: 'image/jpeg' }),
      status: 200,
      headers: { 'Content-Type': 'image/jpeg' },
    });

    const mediaProperties = template.properties.filter(prop => prop.type === 'image');
    const wrappedEntity = await prepareMetadataAndFiles(entity, [], template, mediaProperties);

    // Blob URLs should be skipped (set to empty)
    expect(wrappedEntity.metadata.image).toEqual([
      {
        value: '',
      },
    ]);

    expect(wrappedEntity.metadata.image2).toEqual([
      {
        value: '',
      },
    ]);

    // Should have 0 files since blob URL processing fails
    expect(wrappedEntity.attachments.length).toBe(0);
  });

  it('should handle null and undefined fieldValue gracefully', async () => {
    const testTemplate = {
      _id: 'template1',
      properties: [
        { name: 'image', type: 'image' },
        { name: 'media', type: 'media' },
      ],
    };

    const entity = {
      title: 'Test Entity',
      metadata: {
        image: null,
        media: undefined,
      },
    };

    const result = await prepareMetadataAndFiles(entity, [], testTemplate, testTemplate.properties);

    // Should not crash and return empty metadata for null/undefined values
    expect(result.metadata.image).toEqual([{ value: '' }]);
    expect(result.metadata.media).toEqual([{ value: '' }]);
  });

  it('should fallback to originalFile when blob URL processing fails', async () => {
    const imageFile = new File(
      [Buffer.from('image content').toString('base64')],
      'test-image.jpg',
      {
        type: 'image/jpeg',
      }
    );

    const entity = {
      title: 'Test Entity',
      metadata: {
        image: {
          data: 'blob:invalid-url-format', // Invalid blob URL that will fail regex match
          originalFile: imageFile,
        },
      },
    };

    const mediaProperties = template.properties.filter(prop => prop.type === 'image');
    const result = await prepareMetadataAndFiles(entity, [], template, mediaProperties);

    // Should fallback to originalFile and create proper metadata linking
    expect(result.metadata).toEqual({
      image: [
        {
          value: '',
          attachment: 0,
        },
      ],
    });

    // Should have the File object in attachments
    expect(result.attachments.length).toBe(1);
    expect(result.attachments[0]).toBeInstanceOf(File);
    expect(result.attachments[0]).toBe(imageFile);
  });

  it('should fallback to originalFile when fetch fails', async () => {
    const imageFile = new File(
      [Buffer.from('image content').toString('base64')],
      'test-image.jpg',
      {
        type: 'image/jpeg',
      }
    );

    // Mock fetch to throw an error
    const originalFetch = global.fetch;
    global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

    const entity = {
      title: 'Test Entity',
      metadata: {
        image: {
          data: 'blob:http://localhost:3000/12345678-1234-1234-1234-123456789abc',
          originalFile: imageFile,
        },
      },
    };

    const mediaProperties = template.properties.filter(prop => prop.type === 'image');
    const result = await prepareMetadataAndFiles(entity, [], template, mediaProperties);

    // Should fallback to originalFile despite fetch failure
    expect(result.metadata).toEqual({
      image: [
        {
          value: '',
          attachment: 0,
        },
      ],
    });

    // Should have the File object in attachments
    expect(result.attachments.length).toBe(1);
    expect(result.attachments[0]).toBeInstanceOf(File);
    expect(result.attachments[0]).toBe(imageFile);

    // Restore original fetch
    global.fetch = originalFetch;
  });
});
