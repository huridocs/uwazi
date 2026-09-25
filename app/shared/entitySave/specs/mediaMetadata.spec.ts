import type { MetadataSchema } from '#shared/types/commonTypes.js';
import { mapMediaMetadataForSave } from '../mediaMetadata.js';

type EntityWithMetadata = {
  metadata?: MetadataSchema;
  translations?: Record<string, MetadataSchema>;
  attachments?: Array<{
    _id?: string;
    originalname?: string;
    filename?: string;
    type?: string;
    serializedFile?: string;
    fileLocalID?: string;
    timeLinks?: string;
  }>;
  sharedId?: string;
  template?: string;
  title?: string;
};

const metadata = (prepared: EntityWithMetadata): MetadataSchema =>
  (prepared.metadata ?? {}) as MetadataSchema;

describe('mapMediaMetadataForSave', () => {
  const mediaPropertyNames = new Set(['image', 'media']);
  const mediaPropertyTypes = new Map<string, 'image' | 'media'>([
    ['image', 'image'],
    ['media', 'media'],
  ]);

  describe('current metadata', () => {
    it('maps image upload ids to uploaded attachment indices', () => {
      const entity: EntityWithMetadata = {
        sharedId: 'entity1',
        template: 'template1',
        title: 'Entity',
        metadata: {
          image: [{ value: 'localImageId' }],
          text: [{ value: 'hello' }],
        },
        attachments: [
          {
            _id: 'existing1',
            originalname: 'existing.pdf',
            filename: 'existing.pdf',
            type: 'attachment',
          },
          {
            _id: 'a1',
            originalname: 'photo.jpg',
            filename: 'photo.jpg',
            type: 'attachment',
            serializedFile: 'data:image/jpeg;base64,aW1hZ2U=',
            fileLocalID: 'localImageId',
          },
        ],
      };

      const prepared = mapMediaMetadataForSave(entity, mediaPropertyNames, mediaPropertyTypes);

      expect(metadata(prepared).image).toEqual([{ value: '', attachment: 0 }]);
      expect(metadata(prepared).text).toEqual([{ value: 'hello' }]);
    });

    it('maps media timelinks with upload ids to attachment indices', () => {
      const entity: EntityWithMetadata = {
        sharedId: 'entity1',
        template: 'template1',
        title: 'Entity',
        metadata: {
          media: [{ value: '(localMediaId, {"timelinks":{"00:00:01":"intro"}})' }],
        },
        attachments: [
          {
            _id: 'existing1',
            originalname: 'existing.pdf',
            filename: 'existing.pdf',
            type: 'attachment',
          },
          {
            _id: 'a1',
            originalname: 'clip.mp4',
            filename: 'clip.mp4',
            type: 'attachment',
            serializedFile: 'data:video/mp4;base64,Y2xpcA==',
            fileLocalID: 'localMediaId',
          },
        ],
      };

      const prepared = mapMediaMetadataForSave(entity, mediaPropertyNames, mediaPropertyTypes);

      expect(metadata(prepared).media).toEqual([
        {
          value: '',
          attachment: 0,
          timeLinks: '{"timelinks":{"00:00:01":"intro"}}',
        },
      ]);
    });

    it('uses index 0 for the first uploaded attachment even when existing attachments are present', () => {
      const entity: EntityWithMetadata = {
        sharedId: 'entity1',
        template: 'template1',
        title: 'Entity',
        metadata: {
          image: [{ value: 'newImageId' }],
        },
        attachments: [
          { _id: 'existing1', originalname: 'old.png', filename: 'old.png', type: 'attachment' },
          {
            _id: 'existing2',
            originalname: 'notes.pdf',
            filename: 'notes.pdf',
            type: 'attachment',
          },
          {
            _id: 'pending1',
            originalname: '17839533869478fg3uatq4be.png',
            filename: '17839533869478fg3uatq4be.png',
            type: 'attachment',
            serializedFile: 'data:image/png;base64,aW1hZ2U=',
            fileLocalID: 'newImageId',
          },
        ],
      };

      const prepared = mapMediaMetadataForSave(entity, mediaPropertyNames, mediaPropertyTypes);

      expect(metadata(prepared).image).toEqual([{ value: '', attachment: 0 }]);
    });

    it('clears blob urls from image metadata', () => {
      const entity: EntityWithMetadata = {
        sharedId: 'entity1',
        template: 'template1',
        title: 'Entity',
        metadata: {
          image: [{ value: 'blob:http://localhost:3000/abc' }],
        },
        attachments: [],
      };

      const prepared = mapMediaMetadataForSave(entity, mediaPropertyNames, mediaPropertyTypes);

      expect(metadata(prepared).image).toEqual([{ value: '' }]);
    });

    it('preserves unresolved upload ids instead of wiping them', () => {
      const entity: EntityWithMetadata = {
        sharedId: 'entity1',
        template: 'template1',
        title: 'Entity',
        metadata: {
          image: [{ value: 'missingUploadId' }],
        },
        attachments: [],
      };

      const prepared = mapMediaMetadataForSave(entity, mediaPropertyNames, mediaPropertyTypes);

      expect(metadata(prepared).image).toEqual([{ value: 'missingUploadId' }]);
    });

    it('copies timeLinks from fileLocalID-only pending attachments', () => {
      const entity: EntityWithMetadata = {
        sharedId: 'entity1',
        template: 'template1',
        title: 'Entity',
        metadata: {
          media: [{ value: 'clipId' }],
        },
        attachments: [
          {
            fileLocalID: 'clipId',
            originalname: 'clip.mp4',
            filename: 'clip.mp4',
            type: 'attachment',
            timeLinks: '{"timelinks":{"00:00:13":"Check point 1"}}',
          },
        ],
      };

      const prepared = mapMediaMetadataForSave(entity, mediaPropertyNames, mediaPropertyTypes);

      expect(metadata(prepared).media).toEqual([
        {
          value: '',
          attachment: 0,
          timeLinks: '{"timelinks":{"00:00:13":"Check point 1"}}',
        },
      ]);
    });

    it('does not remap upload ids that lack serializedFile attachments', () => {
      const entity: EntityWithMetadata = {
        sharedId: 'entity1',
        template: 'template1',
        title: 'Entity',
        metadata: {
          image: [{ value: 'staleLocalId' }],
        },
        attachments: [
          {
            _id: 'existing1',
            originalname: 'old.png',
            filename: 'old.png',
            type: 'attachment',
            fileLocalID: 'staleLocalId',
          },
          {
            _id: 'pending1',
            originalname: 'new.png',
            filename: 'new.png',
            type: 'attachment',
            serializedFile: 'data:image/png;base64,aW1hZ2U=',
            fileLocalID: 'newImageId',
          },
        ],
      };

      const prepared = mapMediaMetadataForSave(entity, mediaPropertyNames, mediaPropertyTypes);

      expect(metadata(prepared).image).toEqual([{ value: 'staleLocalId' }]);
    });

    it('preserves existing attachment and timeLinks for empty media values', () => {
      const entity: EntityWithMetadata = {
        sharedId: 'entity1',
        template: 'template1',
        title: 'Entity',
        metadata: {
          image: [{ value: '', attachment: 1 }],
          media: [{ value: '', attachment: 0, timeLinks: '{"timelinks":{}}' }],
        },
        attachments: [{ _id: 'a1' }, { _id: 'a2' }],
      };

      const prepared = mapMediaMetadataForSave(entity, mediaPropertyNames, mediaPropertyTypes);

      expect(metadata(prepared).image).toEqual([{ value: '', attachment: 1 }]);
      expect(metadata(prepared).media).toEqual([
        { value: '', attachment: 0, timeLinks: '{"timelinks":{}}' },
      ]);
    });
  });

  describe('translations', () => {
    it('omits translation media pending uploads so they inherit the target language files', () => {
      const prepared = mapMediaMetadataForSave(
        {
          title: 'New',
          template: 'template1',
          metadata: { image: [{ value: 'enImageId' }] },
          translations: { es: { title: [{ value: 'Nuevo' }], image: [{ value: 'enImageId' }] } },
          attachments: [
            {
              originalname: 'en.png',
              filename: 'en.png',
              fileLocalID: 'enImageId',
              serializedFile: 'data:image/png;base64,aW1hZ2U=',
            },
          ],
        },
        mediaPropertyNames,
        mediaPropertyTypes
      );
      expect(metadata(prepared).image).toEqual([{ value: '', attachment: 0 }]);
      expect(prepared.translations?.es.image).toBeUndefined();
      expect(prepared.translations?.es.title).toEqual([{ value: 'Nuevo' }]);
    });

    it('keeps translation media urls without attachment indices', () => {
      const prepared = mapMediaMetadataForSave(
        {
          title: 'New',
          template: 'template1',
          metadata: { image: [{ value: '/en.jpg' }] },
          translations: { es: { image: [{ value: 'https://cdn/es.jpg' }] } },
          attachments: [],
        },
        mediaPropertyNames,
        mediaPropertyTypes
      );
      expect(prepared.translations?.es.image).toEqual([{ value: 'https://cdn/es.jpg' }]);
    });
  });
});
