import { ObjectId } from 'mongodb';
import { DBFixture } from '#api/utils/testing_db.js';

// entity1 — has a thumbnail matching each language
const entity1EnId = new ObjectId();
const entity1EsId = new ObjectId();
const entity1EnThumbId = new ObjectId();
const entity1EsThumbId = new ObjectId();
const entity1DocEnId = new ObjectId();
const entity1DocEsId = new ObjectId();

// entity2 — only has an 'en' thumbnail; 'es' translation falls back to default (en)
const entity2EnId = new ObjectId();
const entity2EsId = new ObjectId();
const entity2EnThumbId = new ObjectId();
const entity2DocEnId = new ObjectId();

// entity3 — no thumbnail for 'en' or 'fr'; falls back to first available thumbnail ('es')
const entity3EnId = new ObjectId();
const entity3FrId = new ObjectId();
const entity3EsThumbId = new ObjectId();
const entity3DocEsId = new ObjectId();

// entity4 — no thumbnails at all; preview should be unset
const entity4EnId = new ObjectId();
const entity4EsId = new ObjectId();
const entity4DocEnId = new ObjectId();

// entity5 — has a stale preview but no thumbnails; preview should be cleared
const entity5EnId = new ObjectId();

export const fixtures: DBFixture = {
  settings: [
    {
      _id: new ObjectId(),
      languages: [
        { key: 'en', label: 'English', default: true },
        { key: 'es', label: 'Spanish' },
        { key: 'fr', label: 'French' },
      ],
    },
  ],

  entities: [
    // entity1 — en translation
    { _id: entity1EnId, sharedId: 'entity1', language: 'en' },
    // entity1 — es translation
    { _id: entity1EsId, sharedId: 'entity1', language: 'es' },

    // entity2 — en translation
    { _id: entity2EnId, sharedId: 'entity2', language: 'en' },
    // entity2 — es translation (no es thumbnail → falls back to en thumbnail)
    { _id: entity2EsId, sharedId: 'entity2', language: 'es' },

    // entity3 — en translation (no en or fr thumbnail → falls back to first: es thumb)
    { _id: entity3EnId, sharedId: 'entity3', language: 'en' },
    // entity3 — fr translation (no fr thumbnail → falls back to first: es thumb)
    { _id: entity3FrId, sharedId: 'entity3', language: 'fr' },

    // entity4 — no thumbnails at all
    { _id: entity4EnId, sharedId: 'entity4', language: 'en' },
    { _id: entity4EsId, sharedId: 'entity4', language: 'es' },

    // entity5 — stale preview, no thumbnails
    { _id: entity5EnId, sharedId: 'entity5', language: 'en', preview: 'stale.jpg' },
  ],

  files: [
    // entity1 docs and thumbnails (one per language)
    {
      _id: entity1DocEnId,
      entity: 'entity1',
      language: 'eng',
      type: 'document',
      filename: `${entity1DocEnId.toString()}.pdf`,
    },
    {
      _id: entity1EnThumbId,
      entity: 'entity1',
      language: 'eng',
      type: 'thumbnail',
      filename: `${entity1DocEnId.toString()}.jpg`,
    },
    {
      _id: entity1DocEsId,
      entity: 'entity1',
      language: 'spa',
      type: 'document',
      filename: `${entity1DocEsId.toString()}.pdf`,
    },
    {
      _id: entity1EsThumbId,
      entity: 'entity1',
      language: 'spa',
      type: 'thumbnail',
      filename: `${entity1DocEsId.toString()}.jpg`,
    },

    // entity2 — only an en thumbnail
    {
      _id: entity2DocEnId,
      entity: 'entity2',
      language: 'eng',
      type: 'document',
      filename: `${entity2DocEnId.toString()}.pdf`,
    },
    {
      _id: entity2EnThumbId,
      entity: 'entity2',
      language: 'eng',
      type: 'thumbnail',
      filename: `${entity2DocEnId.toString()}.jpg`,
    },

    // entity3 — only an es thumbnail (neither en nor fr)
    {
      _id: entity3DocEsId,
      entity: 'entity3',
      language: 'spa',
      type: 'document',
      filename: `${entity3DocEsId.toString()}.pdf`,
    },
    {
      _id: entity3EsThumbId,
      entity: 'entity3',
      language: 'spa',
      type: 'thumbnail',
      filename: `${entity3DocEsId.toString()}.jpg`,
    },

    // entity4 — document but no thumbnail
    {
      _id: entity4DocEnId,
      entity: 'entity4',
      language: 'eng',
      type: 'document',
      filename: `${entity4DocEnId.toString()}.pdf`,
    },
  ],
};

export {
  entity1EnId,
  entity1EsId,
  entity1DocEnId,
  entity1DocEsId,
  entity2EnId,
  entity2EsId,
  entity2DocEnId,
  entity3EnId,
  entity3FrId,
  entity3DocEsId,
  entity4EnId,
  entity4EsId,
  entity5EnId,
};
