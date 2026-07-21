import { Entity } from '#V2/api/entities/types.js';
import { ClientTemplateSchema } from '#V2/shared/types.js';
import { formatEntityFiles } from '../formatEntityFiles';

const entity1 = {
  _id: '69f37befc11d8f82221f9bdd',
  language: 'es',
  sharedId: '1',
  template: '1',
  user: '1',
  title: 'test 1',
  creationDate: 1,
  metadata: {
    related_images: [
      {
        value: 'j3o7ivjbo4r',
        label: 'Local media',
        icon: {
          _id: null,
          type: 'Empty',
        },
        type: 'entity',
        inheritedValue: [
          {
            value: '/api/files/17779031126528fi9ngtnfu.jpg',
          },
        ],
        inheritedType: 'image',
      },
    ],
    related_videos: [
      {
        value: 'j3o7ivjbo4r',
        label: 'Local media',
        icon: {
          _id: null,
          type: 'Empty',
        },
        type: 'entity',
        inheritedValue: [
          {
            value: '/api/files/17779031126523a3ak1uto9k.mp4',
          },
        ],
        inheritedType: 'media',
      },
    ],
    categories: [],
  },
  documents: [
    {
      _id: '69f37bb0c11d8f82221f8fc1',
      originalname: 'Casa Nina. Resolucion de la Presidenta de 13 de diciembre de 2021.pdf',
      filename: '1777564592344ztzq2rczm.pdf',
      mimetype: 'application/pdf',
      size: 107818,
      creationDate: 1777564592378,
      entity: '6o1xp6radrx',
      status: 'ready',
      type: 'document',
      generatedToc: false,
      language: 'spa',
      totalPages: 3,
    },
  ],
  attachments: [
    {
      _id: '69f8a7009c02734222d9724d',
      originalname: 'entityWithFiles.js',
      filename: '17779033607744xk8luqr308.js',
      mimetype: 'application/x-javascript',
      size: 1696,
      creationDate: 1777903360779,
      entity: '6o1xp6radrx',
      type: 'attachment',
    },
  ],
} as Entity;

const entity2 = {
  _id: '2',
  language: 'es',
  sharedId: '2',
  template: '2',
  user: '1',
  title: 'Local media',
  creationDate: 2,
  editDate: 2,
  metadata: {
    image: [
      {
        value: '/api/files/17779031126528fi9ngtnfu.jpg',
      },
    ],
    video: [
      {
        value: '/api/files/17779031126523a3ak1uto9k.mp4',
      },
    ],
  },
  attachments: [
    {
      _id: '1',
      originalname: 'pluto.jpeg',
      filename: '1.jpg',
      mimetype: 'image/jpeg',
      size: 5287,
      creationDate: 1777903112667,
      entity: '2',
      type: 'attachment',
    },
    {
      _id: '2',
      originalname: 'earth video.mp4',
      filename: '2.mp4',
      mimetype: 'video/mp4',
      size: 1570024,
      creationDate: 1777903112668,
      entity: '2',
      type: 'attachment',
    },
  ],
} as Entity;

const entity3 = {
  _id: '3',
  language: 'es',
  sharedId: '3',
  template: '2',
  user: '3',
  title: 'Remote media',
  creationDate: 3,
  editDate: 3,
  metadata: {
    image: [
      {
        value:
          'https://recentmusic.b-cdn.net/smallImages/28240__28240__0b9491517a74f6bc8ce500a88c6a57b4.jpg',
      },
    ],
    video: [
      {
        value: 'https://www.youtube.com/watch?v=054Fkd3Bwjk',
      },
    ],
  },
  documents: [],
  attachments: [],
};

const entityWithMultipleDocs = {
  _id: '5',
  language: 'es',
  sharedId: '5',
  template: '1',
  user: '1',
  title: 'Entity with multiple documents',
  creationDate: 5,
  metadata: {},
  documents: [
    {
      _id: 'doc-spa',
      originalname: 'document-spa.pdf',
      filename: 'doc-spa.pdf',
      mimetype: 'application/pdf',
      size: 1000,
      creationDate: 1,
      entity: '5',
      status: 'ready',
      type: 'document',
      generatedToc: false,
      language: 'spa',
      totalPages: 2,
    },
    {
      _id: 'doc-eng',
      originalname: 'document-eng.pdf',
      filename: 'doc-eng.pdf',
      mimetype: 'application/pdf',
      size: 1000,
      creationDate: 2,
      entity: '5',
      status: 'ready',
      type: 'document',
      generatedToc: false,
      language: 'eng',
      totalPages: 2,
    },
  ],
  attachments: [],
} as Entity;

const entity4 = {
  _id: '4',
  language: 'es',
  sharedId: '4',
  template: '1',
  user: '1',
  title: 'Entity with link attachments',
  creationDate: 4,
  editDate: 4,
  metadata: {},
  documents: [],
  attachments: [
    {
      _id: '1',
      originalname: 'Some video',
      filename: 'Some video',
      mimetype: 'text/html',
      size: 1,
      creationDate: 1777904946338,
      entity: 'go9zpx4vxun',
      url: 'https://www.youtube.com/watch?v=054Fkd3Bwjk',
      type: 'attachment',
    },
    {
      _id: '1',
      originalname: 'Some image',
      filename: 'Some image',
      mimetype: 'image/jpeg',
      size: 1,
      creationDate: 1777904946339,
      entity: 'go9zpx4vxun',
      url: 'https://recentmusic.b-cdn.net/smallImages/28240__28240__0b9491517a74f6bc8ce500a88c6a57b4.jpg',
      type: 'attachment',
    },
  ],
};

const templates = [
  {
    _id: '1',
    name: 'Template 1',
    properties: [
      {
        _id: '1.1',
        type: 'multiselect',
        label: 'Categories',
        name: 'categories',
        content: '1.1',
      },
      {
        _id: '1.2',
        type: 'relationship',
        label: 'Related images',
        name: 'related_images',
        content: '2',
        relationType: 'rel1',
        inherit: {
          property: '2.1',
          type: 'image',
        },
      },
      {
        _id: '1.3',
        type: 'relationship',
        label: 'Related videos',
        name: 'related_videos',
        content: '2',
        relationType: 'rel2',
        inherit: {
          property: '2.2',
          type: 'media',
        },
      },
    ],
  },
  {
    _id: '2',
    color: '#ff8282',
    name: 'Media',
    properties: [
      {
        _id: '2.1',
        type: 'image',
        label: 'Image',
        name: 'image',
      },
      {
        _id: '2.2',
        type: 'media',
        label: 'Video',
        name: 'video',
      },
    ],
  },
] as ClientTemplateSchema[];

describe('formatEntityFiles', () => {
  it('should return all main files and supporting files', () => {
    const result = formatEntityFiles(entity1, templates, 'es');
    expect(result).toEqual([
      {
        fileType: 'mainDocument',
        file: entity1.documents![0],
      },
      {
        fileType: 'attachment',
        file: entity1.attachments![0],
      },
    ]);
  });

  it('should return also include metadata fields with own files', () => {
    const result = formatEntityFiles(entity2, templates, 'es');
    expect(result).toEqual([
      {
        fileType: 'image',
        file: { filename: '17779031126528fi9ngtnfu.jpg', mimetype: 'image/jpeg' },
      },
      {
        fileType: 'media',
        file: { filename: '17779031126523a3ak1uto9k.mp4', mimetype: 'video/mp4' },
      },
      {
        fileType: 'attachment',
        file: entity2.attachments![0],
      },
      {
        fileType: 'attachment',
        file: entity2.attachments![1],
      },
    ]);
  });

  it('should ignore media fields with link media', () => {
    const result = formatEntityFiles(entity3 as Entity, templates, 'es');
    expect(result).toEqual([]);
  });

  it('should parse media values with timelinks as the underlying file', () => {
    const entityWithTimelinks = {
      ...entity2,
      metadata: {
        ...entity2.metadata,
        video: [
          {
            value: '(/api/files/17779031126523a3ak1uto9k.mp4, {"timelinks":{"00:01:02":"intro"}})',
          },
        ],
      },
    } as Entity;

    const result = formatEntityFiles(entityWithTimelinks, templates, 'es');

    expect(result).toEqual([
      {
        fileType: 'image',
        file: { filename: '17779031126528fi9ngtnfu.jpg', mimetype: 'image/jpeg' },
      },
      {
        fileType: 'media',
        file: { filename: '17779031126523a3ak1uto9k.mp4', mimetype: 'video/mp4' },
      },
      {
        fileType: 'attachment',
        file: entity2.attachments![0],
      },
      {
        fileType: 'attachment',
        file: entity2.attachments![1],
      },
    ]);
  });

  it('should ignore remote media values wrapped with timelinks', () => {
    const entityWithRemoteTimelinks = {
      ...entity3,
      metadata: {
        ...entity3.metadata,
        video: [
          {
            value:
              '(https://www.youtube.com/watch?v=054Fkd3Bwjk, {"timelinks":{"00:00:10":"start"}})',
          },
        ],
      },
    } as Entity;

    expect(formatEntityFiles(entityWithRemoteTimelinks, templates, 'es')).toEqual([]);
  });

  it('should include supporting files that are links', () => {
    const result = formatEntityFiles(entity4 as Entity, templates, 'es');
    expect(result).toEqual([
      {
        fileType: 'externalURL',
        file: entity4.attachments[0],
      },
      {
        fileType: 'externalURL',
        file: entity4.attachments[1],
      },
    ]);
  });

  describe('mainDocument selection with multiple documents', () => {
    it('should mark the document matching the locale as mainDocument', () => {
      const result = formatEntityFiles(entityWithMultipleDocs, templates, 'es');
      expect(result).toEqual([
        { fileType: 'mainDocument', file: entityWithMultipleDocs.documents![0] },
        { fileType: 'document', file: entityWithMultipleDocs.documents![1] },
      ]);
    });

    it('should fall back to the first document when no document matches the locale', () => {
      const result = formatEntityFiles(entityWithMultipleDocs, templates, 'fr');
      expect(result).toEqual([
        { fileType: 'mainDocument', file: entityWithMultipleDocs.documents![0] },
        { fileType: 'document', file: entityWithMultipleDocs.documents![1] },
      ]);
    });

    it('should mark a non-first document as mainDocument when it matches the locale', () => {
      const result = formatEntityFiles(entityWithMultipleDocs, templates, 'en');
      expect(result).toEqual([
        { fileType: 'document', file: entityWithMultipleDocs.documents![0] },
        { fileType: 'mainDocument', file: entityWithMultipleDocs.documents![1] },
      ]);
    });

    it('should fall back to default language document when locale has no match', () => {
      const result = formatEntityFiles(entityWithMultipleDocs, templates, 'fr', 'en');
      expect(result).toEqual([
        { fileType: 'document', file: entityWithMultipleDocs.documents![0] },
        { fileType: 'mainDocument', file: entityWithMultipleDocs.documents![1] },
      ]);
    });
  });
});
