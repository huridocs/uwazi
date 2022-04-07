/**
 * @jest-environment jsdom
 */
import fetchMock from 'fetch-mock';
import { ClientTemplateSchema } from 'app/istore';
import { wrapEntityMetadata, prepareMetadataAndFiles } from '../wrapper';

describe('wrapEntityMetadata', () => {
  it('should return entity as is if there is no metadata', () => {
    const entity = { title: 'title', template: 'template1' };
    const wrappedEntity = wrapEntityMetadata(entity);
    expect(wrappedEntity).toEqual(entity);
  });
  it('should return correct entity metadata with linked attachments to metadata fields', () => {
    const entity = {
      title: 'A title',
      metadata: {
        text: 'Texto 1',
        image: 'k3rutmyxrdr',
      },
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
    const wrappedEntity = wrapEntityMetadata(entity);
    expect(wrappedEntity).toEqual({
      title: 'A title',
      metadata: {
        text: [
          {
            value: 'Texto 1',
          },
        ],
        image: [
          {
            value: '',
            attachment: 1,
          },
        ],
      },
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
