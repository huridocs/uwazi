import type { Template } from '#app/apiResponseTypes.js';
import type { Entity, FileType } from '#V2/api/entities/types.js';
import { thumbnailFromEntity } from '../cardModel.js';

const entity = (overrides: Partial<Entity> = {}): Entity => ({
  _id: 'e1',
  sharedId: 's1',
  title: 'Hearing',
  template: 'tmpl1',
  language: 'en',
  creationDate: 1,
  user: 'u1',
  ...overrides,
});

const template = (properties: Template['properties']): Template =>
  ({
    _id: 'tmpl1',
    name: 'Hearing',
    properties,
  }) as Template;

const audioAttachment = (overrides: Partial<FileType> = {}): FileType => ({
  _id: '6ab26d3efcad86139956182d',
  filename: '1790078270654848yvqnf86q.mpga',
  originalname: 'audio-prueba.mp3',
  mimetype: 'audio/mpeg',
  type: 'attachment',
  ...overrides,
});

describe('thumbnail kind for audio media', () => {
  it('classifies the hjk-style audio field stored as .mpga as audio, not video', () => {
    const hearing = entity({
      metadata: {
        video: [],
        audio: [{ value: '/api/files/1790078270654848yvqnf86q.mpga' }],
        image: [{ value: '/api/files/17900782341876ri5ao2986x.png' }],
      },
    });
    const tmpl = template([
      { _id: 'p-video', name: 'video', label: 'Video', type: 'media', showInCard: true },
      { _id: 'p-audio', name: 'audio', label: 'Audio', type: 'media', showInCard: true },
      { _id: 'p-image', name: 'image', label: 'Image', type: 'image', showInCard: true },
    ]);

    expect(thumbnailFromEntity(hearing, tmpl)).toEqual({
      src: '/api/files/1790078270654848yvqnf86q.mpga',
      propertyName: 'audio',
      kind: 'audio',
      fit: 'cover',
    });
  });

  it('classifies a media field at /api/files/id without an audio extension as audio', () => {
    const hearing = entity({
      metadata: { audio: [{ value: '/api/files/6ab26d3efcad86139956182d' }] },
      attachments: [audioAttachment()],
    });
    const tmpl = template([
      { _id: 'p-audio', name: 'audio', label: 'Audio', type: 'media', showInCard: true },
    ]);

    expect(thumbnailFromEntity(hearing, tmpl)).toEqual({
      src: '/api/files/6ab26d3efcad86139956182d',
      propertyName: 'audio',
      kind: 'audio',
      fit: 'cover',
    });
  });

  it('unwraps a timelink payload without an audio extension and still classifies it as audio', () => {
    const hearing = entity({
      metadata: {
        audio: [
          {
            value: '(/api/files/6ab26d3efcad86139956182d, {"timelinks":{"00:00:00":""}})',
          },
        ],
      },
      attachments: [audioAttachment({ filename: 'stored.mpga' })],
    });
    const tmpl = template([
      { _id: 'p-audio', name: 'audio', label: 'Audio', type: 'media', showInCard: true },
    ]);

    expect(thumbnailFromEntity(hearing, tmpl)).toEqual({
      src: '/api/files/6ab26d3efcad86139956182d',
      propertyName: 'audio',
      kind: 'audio',
      fit: 'cover',
    });
  });
});
