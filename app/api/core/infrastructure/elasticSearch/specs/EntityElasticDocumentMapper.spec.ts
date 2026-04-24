import { ObjectId } from 'mongodb';
import { EntityDBO } from '#api/entities.v2/database/schemas/EntityTypes.js';
import { SlotType } from '../entities/SlotType.js';
import { EntityElasticDocumentMapper } from '../entities/EntityElasticDocumentMapper.js';
import { MongoSlotsDAO, SlotMap } from '../entities/MongoSlotsDAO.js';

const createEntity = (override: Partial<EntityDBO> = {}): EntityDBO => ({
  _id: new ObjectId(),
  sharedId: 'shared-1',
  language: 'en',
  template: new ObjectId(),
  title: 'Entity title',
  metadata: {},
  obsoleteMetadata: [],
  published: true,
  creationDate: 1000,
  editDate: 2000,
  ...override,
});

/**
 * Builds a SlotMap entry for a non-translatable slot (key = propertyName).
 */
const nonTranslatableEntry = (assignedTo: string, slotName: string, type: SlotType) =>
  [
    assignedTo,
    { _id: new ObjectId(), assignedTo, slotName, type, language: null, rand: 0 },
  ] as const;

/**
 * Builds a SlotMap entry for a translatable slot (key = propertyName::language).
 */
const translatableEntry = (
  assignedTo: string,
  language: string,
  slotName: string,
  type: SlotType
) =>
  [
    MongoSlotsDAO.slotKey(assignedTo, language as any),
    { _id: new ObjectId(), assignedTo, slotName, type, language, rand: 0 },
  ] as const;

const createSlotMap = (entries: (readonly [string, any])[]): SlotMap => new Map(entries);

describe('EntityElasticDocumentMapper', () => {
  describe('toDocuments grouping and root-level fields', () => {
    it('returns an empty array for empty input', () => {
      expect(EntityElasticDocumentMapper.toDocuments([], new Map())).toEqual([]);
    });

    it('produces one output document per sharedId', () => {
      const templateId = new ObjectId();
      const en = createEntity({ sharedId: 'abc', language: 'en', template: templateId });
      const es = createEntity({ sharedId: 'abc', language: 'es', template: templateId });

      const result = EntityElasticDocumentMapper.toDocuments([en, es], new Map());

      expect(result).toHaveLength(1);
      expect(result[0].sharedId).toBe('abc');
    });

    it('produces separate documents for different sharedId values', () => {
      const a = createEntity({ sharedId: 'aaa' });
      const b = createEntity({ sharedId: 'bbb' });

      const result = EntityElasticDocumentMapper.toDocuments([a, b], new Map());

      expect(result).toHaveLength(2);
      expect(result.map(r => r.sharedId).sort()).toEqual(['aaa', 'bbb']);
    });

    it('maps root-level scalar fields from the first variant', () => {
      const userId = new ObjectId();
      const templateId = new ObjectId();
      const en = createEntity({
        sharedId: 'shared-entity',
        language: 'en',
        template: templateId,
        user: userId,
        published: true,
        creationDate: 1000,
        editDate: 2000,
        permissions: [
          { refId: new ObjectId().toString(), type: 'user', level: 'read' },
          { refId: new ObjectId(), type: 'group', level: 'write' },
        ],
      });

      const [{ document }] = EntityElasticDocumentMapper.toDocuments([en], new Map());

      expect(document).toMatchObject({
        sharedId: 'shared-entity',
        template: templateId.toString(),
        user: userId.toString(),
        published: true,
        creationDate: 1000,
        editDate: 2000,
        fullText: { name: 'entity' },
      });
      expect(document.permissionRefIds).toHaveLength(2);
      expect(document).not.toHaveProperty('language');
      expect(document).not.toHaveProperty('title');
      expect(document).not.toHaveProperty('rawEntity');
      expect(document).not.toHaveProperty('tenantId');
    });

    it('builds rawEntities keyed by language for all variants', () => {
      const templateId = new ObjectId();
      const en = createEntity({ sharedId: 'abc', language: 'en', template: templateId });
      const es = createEntity({ sharedId: 'abc', language: 'es', template: templateId });

      const [{ document }] = EntityElasticDocumentMapper.toDocuments([en, es], new Map());

      expect(document.rawEntities).toMatchObject({ en, es });
    });
  });

  describe('title synthesis', () => {
    it('maps title into a translatable txt slot for each language variant', () => {
      const templateId = new ObjectId();
      const en = createEntity({
        sharedId: 'abc',
        language: 'en',
        title: 'English title',
        template: templateId,
      });
      const es = createEntity({
        sharedId: 'abc',
        language: 'es',
        title: 'Spanish title',
        template: templateId,
      });

      const slotMap = createSlotMap([
        translatableEntry('title', 'en', 'txt_01', 'txt'),
        translatableEntry('title', 'es', 'txt_02', 'txt'),
      ]);

      const [{ document }] = EntityElasticDocumentMapper.toDocuments([en, es], slotMap);

      expect(document.metadata).toMatchObject({
        txt_01: ['English title'],
        txt_02: ['Spanish title'],
      });
    });

    it('skips title for a variant whose language has no slot', () => {
      const en = createEntity({ sharedId: 'abc', language: 'en', title: 'English title' });
      const slotMap = createSlotMap([
        // no title::en entry
      ]);

      const [{ document }] = EntityElasticDocumentMapper.toDocuments([en], slotMap);

      expect(document.metadata).not.toHaveProperty('txt_01');
    });
  });

  describe('translatable metadata properties', () => {
    it('maps each variant independently using language-specific slot keys', () => {
      const templateId = new ObjectId();
      const en = createEntity({
        sharedId: 'abc',
        language: 'en',
        template: templateId,
        metadata: { nameProp: [{ value: 'Alice' }] },
      });
      const es = createEntity({
        sharedId: 'abc',
        language: 'es',
        template: templateId,
        metadata: { nameProp: [{ value: 'Alicia' }] },
      });

      const slotMap = createSlotMap([
        translatableEntry('nameProp', 'en', 'txt_01', 'txt'),
        translatableEntry('nameProp', 'es', 'txt_02', 'txt'),
      ]);

      const [{ document }] = EntityElasticDocumentMapper.toDocuments([en, es], slotMap);

      expect(document.metadata).toMatchObject({
        txt_01: ['Alice'],
        txt_02: ['Alicia'],
      });
    });

    it('skips a variant whose language slot is absent from slotMap', () => {
      const templateId = new ObjectId();
      const en = createEntity({
        sharedId: 'abc',
        language: 'en',
        template: templateId,
        metadata: { nameProp: [{ value: 'Alice' }] },
      });
      const fr = createEntity({
        sharedId: 'abc',
        language: 'fr',
        template: templateId,
        metadata: { nameProp: [{ value: 'Alicette' }] },
      });

      const slotMap = createSlotMap([
        translatableEntry('nameProp', 'en', 'txt_01', 'txt'),
        // no fr slot
      ]);

      const [{ document }] = EntityElasticDocumentMapper.toDocuments([en, fr], slotMap);

      expect(document.metadata).toMatchObject({ txt_01: ['Alice'] });
      expect(Object.keys(document.metadata)).toHaveLength(1);
    });
  });

  describe('non-translatable metadata properties', () => {
    it('maps non-translatable metadata from the first variant only', () => {
      const templateId = new ObjectId();
      const en = createEntity({
        sharedId: 'abc',
        language: 'en',
        template: templateId,
        metadata: { dateProp: [{ value: 1700000000000 }] },
      });
      const es = createEntity({
        sharedId: 'abc',
        language: 'es',
        template: templateId,
        metadata: { dateProp: [{ value: 9999999999999 }] },
      });

      const slotMap = createSlotMap([nonTranslatableEntry('dateProp', 'date_01', 'date')]);

      const [{ document }] = EntityElasticDocumentMapper.toDocuments([en, es], slotMap);

      expect(document.metadata).toMatchObject({ date_01: [1700000000000] });
    });
  });

  describe('silently skips', () => {
    it('silently skips metadata properties that have no slot assignment', () => {
      const entity = createEntity({
        metadata: {
          withSlot: [{ value: 'indexed value' }],
          withoutSlot: [{ value: 'ignored value' }],
        },
      });

      const slotMap = createSlotMap([translatableEntry('withSlot', 'en', 'txt_01', 'txt')]);

      const [{ document }] = EntityElasticDocumentMapper.toDocuments([entity], slotMap);

      expect(document.metadata).toEqual({ txt_01: ['indexed value'] });
      expect(document.metadata).not.toHaveProperty('withoutSlot');
    });
  });

  describe('maps all supported slot types', () => {
    it('maps all supported PropertyType values and silently skips unsupported ones', () => {
      const metadata = {
        textProp: [{ value: 'text value' }],
        markdownProp: [{ value: 'markdown value' }],
        generatedIdProp: [{ value: 'gid-001' }],
        linkProp: [{ value: { url: 'https://example.org', label: 'Example URL' } }],

        dateProp: [{ value: 1700000000000 }],
        multidateProp: [{ value: 1700000001000 }, { value: 1700000002000 }],

        numericProp: [{ value: 123.45 }],

        dateRangeProp: [{ value: { from: 1600, to: 1700 } }],
        multidateRangeProp: [
          { value: { from: 1800, to: 1900 } },
          { value: { from: 2000, to: 2100 } },
        ],

        selectProp: [
          { value: 'opt-a', label: 'Option A', parent: { value: 'group-a', label: 'Group A' } },
        ],
        multiselectProp: [
          { value: 'opt-b', label: 'Option B' },
          { value: 'opt-c', label: 'Option C' },
        ],

        relationshipProp: [
          {
            value: 'entity-1',
            label: 'Entity 1',
            inheritedType: 'relationship',
            inheritedValue: [{ value: 'entity-2', label: 'Entity 2' }],
          },
        ],
        relationshipTextProp: [
          {
            value: 'entity-txt',
            label: 'Entity Text',
            inheritedType: 'text',
            inheritedValue: [{ value: 'inherited text' }],
          },
        ],
        relationshipLinkProp: [
          {
            value: 'entity-link',
            label: 'Entity Link',
            inheritedType: 'link',
            inheritedValue: [
              { value: { url: 'https://inherited.example', label: 'Inherited link' } },
            ],
          },
        ],
        relationshipNumericProp: [
          {
            value: 'entity-num',
            label: 'Entity Numeric',
            inheritedType: 'numeric',
            inheritedValue: [{ value: 100.5 }],
          },
        ],
        relationshipDateProp: [
          {
            value: 'entity-date',
            label: 'Entity Date',
            inheritedType: 'date',
            inheritedValue: [{ value: 1700000000000 }],
          },
        ],
        relationshipRangeProp: [
          {
            value: 'entity-range',
            label: 'Entity Range',
            inheritedType: 'daterange',
            inheritedValue: [{ value: { from: 3000, to: 4000 } }],
          },
        ],
        relationshipSelectProp: [
          {
            value: 'entity-select',
            label: 'Entity Select',
            inheritedType: 'select',
            inheritedValue: [
              {
                value: 'opt-inherited',
                label: 'Inherited option',
                parent: { value: 'group-inherited', label: 'Inherited Group' },
              },
            ],
          },
        ],
        relationshipGeolocationProp: [
          {
            value: 'entity-geo',
            label: 'Entity Geo',
            inheritedType: 'geolocation',
            inheritedValue: [{ value: { lat: 10, lon: 20, label: 'Inherited point' } }],
          },
        ],

        geolocationProp: [{ value: { lat: -33.45, lon: -70.66 } }],

        imageProp: [{ value: 'image-file-id' }],
        mediaProp: [{ value: 'media-file-id' }],
        previewProp: [{ value: 'preview-value' }],
        nestedProp: [{ value: 'nested-value' }],
      } as unknown as EntityDBO['metadata'];

      const entity = createEntity({ language: 'en', metadata });

      const slotMap = createSlotMap([
        translatableEntry('textProp', 'en', 'txt_01', 'txt'),
        translatableEntry('markdownProp', 'en', 'txt_02', 'txt'),
        translatableEntry('generatedIdProp', 'en', 'txt_03', 'txt'),
        translatableEntry('linkProp', 'en', 'txt_04', 'txt'),

        nonTranslatableEntry('dateProp', 'date_01', 'date'),
        nonTranslatableEntry('multidateProp', 'date_02', 'date'),

        nonTranslatableEntry('numericProp', 'num_01', 'num'),

        nonTranslatableEntry('dateRangeProp', 'range_01', 'range'),
        nonTranslatableEntry('multidateRangeProp', 'range_02', 'range'),

        translatableEntry('selectProp', 'en', 'select_01', 'select'),
        translatableEntry('multiselectProp', 'en', 'select_02', 'select'),

        translatableEntry('relationshipProp', 'en', 'relationship_01', 'relationship'),
        translatableEntry('relationshipTextProp', 'en', 'relationship_txt_01', 'relationship_txt'),
        translatableEntry('relationshipLinkProp', 'en', 'relationship_txt_02', 'relationship_txt'),
        nonTranslatableEntry('relationshipNumericProp', 'relationship_num_01', 'relationship_num'),
        nonTranslatableEntry('relationshipDateProp', 'relationship_date_01', 'relationship_date'),
        nonTranslatableEntry(
          'relationshipRangeProp',
          'relationship_range_01',
          'relationship_range'
        ),
        translatableEntry(
          'relationshipSelectProp',
          'en',
          'relationship_select_01',
          'relationship_select'
        ),
        nonTranslatableEntry(
          'relationshipGeolocationProp',
          'relationship_geolocation_01',
          'relationship_geolocation'
        ),

        nonTranslatableEntry('geolocationProp', 'geolocation_01', 'geolocation'),
      ]);

      const [{ document }] = EntityElasticDocumentMapper.toDocuments([entity], slotMap);

      expect(document.metadata).toEqual({
        txt_01: ['text value'],
        txt_02: ['markdown value'],
        txt_03: ['gid-001'],
        txt_04: ['https://example.org'],

        date_01: [1700000000000],
        date_02: [1700000001000, 1700000002000],

        num_01: [123.45],

        range_01: [{ gte: 1600, lte: 1700 }],
        range_02: [
          { gte: 1800, lte: 1900 },
          { gte: 2000, lte: 2100 },
        ],

        select_01: [
          { value: 'opt-a', label: 'Option A', parent: { value: 'group-a', label: 'Group A' } },
        ],
        select_02: [
          { value: 'opt-b', label: 'Option B' },
          { value: 'opt-c', label: 'Option C' },
        ],
        relationship_01: [
          {
            value: 'entity-1',
            label: 'Entity 1',
          },
        ],
        relationship_txt_01: [
          {
            value: 'entity-txt',
            label: 'Entity Text',
            inheritedValue: ['inherited text'],
          },
        ],
        relationship_txt_02: [
          {
            value: 'entity-link',
            label: 'Entity Link',
            inheritedValue: ['https://inherited.example'],
          },
        ],
        relationship_num_01: [
          {
            value: 'entity-num',
            label: 'Entity Numeric',
            inheritedValue: [100.5],
          },
        ],
        relationship_date_01: [
          {
            value: 'entity-date',
            label: 'Entity Date',
            inheritedValue: [1700000000000],
          },
        ],
        relationship_range_01: [
          {
            value: 'entity-range',
            label: 'Entity Range',
            inheritedValue: [{ gte: 3000, lte: 4000 }],
          },
        ],
        relationship_select_01: [
          {
            value: 'entity-select',
            label: 'Entity Select',
            inheritedValue: [
              {
                value: 'opt-inherited',
                label: 'Inherited option',
                parent: { value: 'group-inherited', label: 'Inherited Group' },
              },
            ],
          },
        ],
        relationship_geolocation_01: [
          {
            value: 'entity-geo',
            label: 'Entity Geo',
            inheritedValue: [{ lat: 10, lon: 20 }],
          },
        ],
        geolocation_01: [{ lat: -33.45, lon: -70.66 }],
      });
    });
  });
});
