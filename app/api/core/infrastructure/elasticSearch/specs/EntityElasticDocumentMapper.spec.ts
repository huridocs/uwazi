import { ObjectId } from 'mongodb';
import { EntityDBO } from '#api/entities.v2/database/schemas/EntityTypes.js';
import { PropertyType } from '#api/core/domain/template/PropertyType.js';
import { EntityElasticDocumentMapper } from '../entities/EntityElasticDocumentMapper.js';
import { SlotMap } from '../entities/MongoSlotsDAO.js';

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

const expectMappedScalarFields = (document: any, entity: EntityDBO, userId: ObjectId) => {
  expect(document).toMatchObject({
    sharedId: 'shared-entity',
    language: 'es',
    title: 'Mapped title',
    template: entity.template.toString(),
    user: userId.toString(),
    rawEntity: entity,
    published: true,
    creationDate: 1000,
    editDate: 2000,
    permissionRefIds: entity.permissions!.map(permission => permission.refId.toString()),
    fullText: { name: 'entity' },
  });

  expect(document).not.toHaveProperty('tenantId');
  expect(document).not.toHaveProperty('created_at');
  expect(document).not.toHaveProperty('updated_at');
};

const createSlotMap = (
  entries: Array<{ assignedTo: string; slotName: string; type: PropertyType }>
): SlotMap =>
  new Map(
    entries.map(entry => [
      entry.assignedTo,
      {
        _id: new ObjectId(),
        assignedTo: entry.assignedTo,
        slotName: entry.slotName,
        type: entry.type,
      },
    ])
  );

describe('EntityElasticDocumentMapper', () => {
  it('maps root level fields', () => {
    const userId = new ObjectId();
    const entity = createEntity({
      sharedId: 'shared-entity',
      language: 'es',
      title: 'Mapped title',
      user: userId,
      permissions: [
        { refId: new ObjectId().toString(), type: 'user', level: 'read' },
        { refId: new ObjectId(), type: 'group', level: 'write' },
      ],
    });

    const [document] = EntityElasticDocumentMapper.toDocuments([entity], new Map());

    expectMappedScalarFields(document, entity, userId);
  });

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

    const entity = createEntity({ metadata });

    const slotMap = createSlotMap([
      { assignedTo: 'textProp', slotName: 'txt_01', type: 'text' },
      { assignedTo: 'markdownProp', slotName: 'txt_02', type: 'markdown' },
      { assignedTo: 'generatedIdProp', slotName: 'txt_03', type: 'generatedid' },
      { assignedTo: 'linkProp', slotName: 'txt_04', type: 'link' },

      { assignedTo: 'dateProp', slotName: 'date_01', type: 'date' },
      { assignedTo: 'multidateProp', slotName: 'date_02', type: 'multidate' },

      { assignedTo: 'numericProp', slotName: 'num_01', type: 'numeric' },

      { assignedTo: 'dateRangeProp', slotName: 'range_01', type: 'daterange' },
      { assignedTo: 'multidateRangeProp', slotName: 'range_02', type: 'multidaterange' },

      { assignedTo: 'selectProp', slotName: 'select_01', type: 'select' },
      { assignedTo: 'multiselectProp', slotName: 'select_02', type: 'multiselect' },

      { assignedTo: 'relationshipProp', slotName: 'relationship_01', type: 'relationship' },
      {
        assignedTo: 'relationshipTextProp',
        slotName: 'relationship_txt_01',
        type: 'relationship',
      },
      {
        assignedTo: 'relationshipLinkProp',
        slotName: 'relationship_txt_02',
        type: 'relationship',
      },
      {
        assignedTo: 'relationshipNumericProp',
        slotName: 'relationship_num_01',
        type: 'relationship',
      },
      {
        assignedTo: 'relationshipDateProp',
        slotName: 'relationship_date_01',
        type: 'relationship',
      },
      {
        assignedTo: 'relationshipRangeProp',
        slotName: 'relationship_range_01',
        type: 'relationship',
      },
      {
        assignedTo: 'relationshipSelectProp',
        slotName: 'relationship_select_01',
        type: 'relationship',
      },
      {
        assignedTo: 'relationshipGeolocationProp',
        slotName: 'relationship_geolocation_01',
        type: 'relationship',
      },

      { assignedTo: 'geolocationProp', slotName: 'geolocation_01', type: 'geolocation' },
    ]);

    const [document] = EntityElasticDocumentMapper.toDocuments([entity], slotMap);

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

  it('silently skips metadata properties that have no slot assignment', () => {
    const entity = createEntity({
      metadata: {
        withSlot: [{ value: 'indexed value', label: 'Indexed value' }],
        withoutSlot: [{ value: 'ignored value', label: 'Ignored value' }],
      },
    });

    const slotMap = createSlotMap([{ assignedTo: 'withSlot', slotName: 'txt_01', type: 'text' }]);

    const [document] = EntityElasticDocumentMapper.toDocuments([entity], slotMap);

    expect(document.metadata).toEqual({ txt_01: ['indexed value'] });
    expect(document.metadata).not.toHaveProperty('withoutSlot');
  });

  it('returns an empty array for empty input', () => {
    expect(EntityElasticDocumentMapper.toDocuments([], new Map())).toEqual([]);
  });
});
