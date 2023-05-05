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

    const wrappedEntity = await prepareMetadataAndFiles(entity, [document], template);
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
});
