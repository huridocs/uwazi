import type { MetadataSchema } from '#shared/types/commonTypes.js';
import type { EntitySaveInput } from '#V2/services/contracts/EntitiesService.js';
import { mapMediaMetadataForSave } from '../mapMediaMetadataForSave.js';

const metadata = (prepared: EntitySaveInput): MetadataSchema =>
  (prepared.metadata ?? {}) as MetadataSchema;

describe('mapMediaMetadataForSave', () => {
  const mediaPropertyNames = new Set(['image', 'media']);
  const mediaPropertyTypes = new Map<string, 'image' | 'media'>([
    ['image', 'image'],
    ['media', 'media'],
  ]);

  it('maps image upload ids to uploaded attachment indices', () => {
    const entity: EntitySaveInput = {
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
    const entity: EntitySaveInput = {
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
    const entity: EntitySaveInput = {
      sharedId: 'entity1',
      template: 'template1',
      title: 'Entity',
      metadata: {
        image: [{ value: 'newImageId' }],
      },
      attachments: [
        {
          _id: 'existing1',
          originalname: 'old.png',
          filename: 'old.png',
          type: 'attachment',
        },
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
    const entity: EntitySaveInput = {
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
});
