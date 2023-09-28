/* eslint-disable max-lines */
/* eslint-disable max-len */
import { getFixturesFactory } from 'api/utils/fixturesFactory';
import db from 'api/utils/testing_db';
import { AccessLevels, PermissionType } from 'shared/types/permissionSchema';

const fixtureFactory = getFixturesFactory();

const batmanFinishesId = db.id();
const batmanStillNotDoneId = db.id();
const syncPropertiesEntityId = db.id();
const templateId = db.id();
const templateChangingNames = db.id();
const referenceId = db.id();
const templateWithEntityAsThesauri = db.id();
const templateWithEntityAsThesauri2 = db.id();
const templateWithOnlySelect = db.id();
const templateWithOnlyMultiselect = db.id();
const templateChangingNamesProps = {
  prop1id: db.id(),
  prop2id: db.id(),
  prop3id: db.id(),
};
const adminId = db.id();

const dictionary = db.id();
const c1 = db.id();
const c2 = db.id();

const hub1 = db.id();
const hub2 = db.id();
const hub3 = db.id();
const hub4 = db.id();
const hub5 = db.id();
const hub6 = db.id();
const hub7 = db.id();

const docId1 = db.id();
const docId2 = db.id();
const shared2 = db.id();
const unpublishedDocId = db.id();
const relationType1 = db.id();
const relationType2 = db.id();
const relationType3 = db.id();
const relationType4 = db.id();
const uploadId1 = db.id();
const uploadId2 = db.id();
const inheritedProperty = db.id();

const entityGetTestTemplateId = db.id();
const entityGetTestEntityIdA = db.id();
const entityGetTestEntityIdB = db.id();
const entityGetTestEntityIdC = db.id();
const entityGetTestFileId1 = db.id();
const entityGetTestFileId2 = db.id();
const entityGetTestFileId3 = db.id();

const permissions = [{ refId: 'userId', level: AccessLevels.WRITE, type: PermissionType.USER }];

export default {
  users: [
    {
      _id: adminId,
      password: 'hashedpass',
      username: 'admin',
      email: 'admin@uwazi.com',
      role: 'admin',
    },
  ],
  files: [
    {
      _id: db.id(),
      entity: 'shared',
      filename: `${uploadId1}.jpg`,
      language: 'en',
      type: 'thumbnail',
    },
    {
      _id: db.id(),
      entity: 'shared',
      filename: `${uploadId2}.jpg`,
      language: 'es',
      type: 'thumbnail',
    },
    {
      _id: uploadId1,
      entity: 'shared',
      filename: '8202c463d6158af8065022d9b5014cc1.pdf',
      language: 'en',
      type: 'document',
      fullText: {
        1: 'page[[1]] 1[[1]]',
        2: 'page[[2]] 2[[2]]',
        3: '',
      },
    },
    {
      _id: uploadId2,
      entity: 'shared',
      filename: '8202c463d6158af8065022d9b5014ccb.pdf',
      language: 'es',
      type: 'document',
      fullText: { 1: 'text' },
    },
    {
      entity: 'shared',
      filename: '8202c463d6158af8065022d9b5014ccc.pdf',
      language: 'pt',
      type: 'attachment',
    },
    {
      entity: 'shared1',
      language: 'en',
      filename: 'nonexistent.pdf',
      type: 'document',
      fullText: { 1: 'text' },
    },
    {
      entity: 'shared1',
      filename: 'nonexistent.pdf',
      type: 'document',
      language: 'es',
    },
    {
      entity: 'shared1',
      filename: 'nonexistent.pdf',
      type: 'document',
      language: 'pt',
    },
    {
      entity: 'shared10',
      filename: '123.pdf',
      type: 'document',
      language: 'pt',
    },
    {
      entity: 'multiselect',
      filename: '123.pdf',
      type: 'document',
      language: 'en',
    },
    {
      entity: 'multiselect',
      filename: '123.pdf',
      language: 'es',
      fullText: { 1: 'text' },
      type: 'document',
    },
    // files to test entity.get
    {
      _id: entityGetTestFileId1,
      entity: 'entityGetTestEntityIdC',
      originalname: 'my file1.name',
      filename: 'file1.name',
      language: 'en',
      type: 'attachment',
    },
    {
      _id: entityGetTestFileId2,
      entity: 'entityGetTestEntityIdA',
      filename: 'file2.name',
      language: 'en',
      type: 'document',
    },
    {
      _id: entityGetTestFileId3,
      entity: 'entityGetTestEntityIdC',
      filename: 'file3.name',
      language: 'en',
      type: 'document',
    },
    {
      _id: db.id(),
      entity: 'entityGetTestEntityIdC',
      originalname: 'File4.name',
      filename: 'file4.name',
      language: 'en',
      type: 'attachment',
    },
  ],
  entities: [
    {
      _id: batmanFinishesId,
      sharedId: 'shared',
      type: 'entity',
      template: templateId,
      language: 'en',
      title: 'Batman finishes',
      published: true,
      metadata: {
        text: [{ value: 'textvalue' }],
        property1: [{ value: 'value1' }],
        property2: [{ value: 'value2' }],
        description: [{ value: 'descriptionvalue' }],
        friends: [{ icon: null, label: 'shared2title', type: 'entity', value: 'shared2' }],
        enemies: [{ icon: null, label: 'shared2title', type: 'entity', value: 'shared2' }],
        select: [],
      },
    },
    {
      _id: batmanStillNotDoneId,
      sharedId: 'relSaveTest',
      type: 'entity',
      template: templateId,
      language: 'en',
      title: 'Batman still not done',
      published: true,
      metadata: {
        property1: [{ value: 'value1' }],
        friends: [{ icon: null, label: 'shared2title', type: 'entity', value: 'shared2' }],
        enemies: [{ icon: null, label: 'shared2title', type: 'entity', value: 'shared2' }],
      },
    },
    {
      _id: docId1,
      sharedId: 'shared',
      type: 'entity',
      language: 'es',
      title: 'Penguin almost done',
      creationDate: 1,
      published: true,
    },
    {
      _id: docId2,
      sharedId: 'shared',
      type: 'entity',
      language: 'pt',
      title: 'Penguin almost done',
      creationDate: 1,
      published: true,
      metadata: { text: [{ value: 'test' }] },
    },
    {
      _id: unpublishedDocId,
      sharedId: 'other',
      type: 'entity',
      template: templateId,
      language: 'en',
      title: 'Unpublished entity',
      published: false,
      metadata: {
        property2: [{ value: 'value1' }],
        enemies: [
          { icon: null, label: 'shouldNotChange', type: 'entity', value: 'shared1' },
          { icon: null, label: 'shared2title', type: 'entity', value: 'shared2' },
          { icon: null, label: 'shouldNotChange1', type: 'entity', value: 'shared1' },
        ],
      },
      permissions: [
        { refId: 'user1', level: AccessLevels.READ, type: PermissionType.USER },
        { refId: 'user2', level: AccessLevels.WRITE, type: PermissionType.USER },
      ],
    },
    {
      sharedId: 'other',
      template: templateId,
      title: 'Unpublished entity ES',
      language: 'es',
      metadata: {
        enemies: [
          { icon: null, label: 'translated1', type: 'entity', value: 'shared2' },
          { icon: null, label: 'translated2', type: 'entity', value: 'shared1' },
        ],
      },
      permissions: [
        { refId: 'user1', level: AccessLevels.READ, type: PermissionType.USER },
        { refId: 'user2', level: AccessLevels.WRITE, type: PermissionType.USER },
      ],
    },
    //select/multiselect/date sync
    {
      _id: syncPropertiesEntityId,
      template: templateId,
      sharedId: 'shared1',
      type: 'entity',
      language: 'en',
      title: 'EN',
      published: true,
      metadata: { property1: [{ value: 'text' }] },
      permissions: [
        { refId: 'user1', level: AccessLevels.WRITE, type: PermissionType.USER },
        { refId: 'group1', level: AccessLevels.WRITE, type: PermissionType.GROUP },
      ],
    },
    {
      _id: db.id(),
      template: templateId,
      sharedId: 'shared1',
      type: 'entity',
      language: 'es',
      title: 'ES',
      creationDate: 1,
      published: true,
      metadata: { property1: [{ value: 'text' }] },
      permissions: [
        { refId: 'user1', level: AccessLevels.WRITE, type: PermissionType.USER },
        { refId: 'group1', level: AccessLevels.WRITE, type: PermissionType.GROUP },
      ],
    },
    {
      _id: db.id(),
      template: templateId,
      sharedId: 'shared1',
      type: 'entity',
      language: 'pt',
      title: 'PT',
      creationDate: 1,
      published: true,
      metadata: { property1: [{ value: 'text' }] },
      permissions: [
        { refId: 'user1', level: AccessLevels.WRITE, type: PermissionType.USER },
        { refId: 'group1', level: AccessLevels.WRITE, type: PermissionType.GROUP },
      ],
    },
    //docs to change metadata property names
    {
      _id: db.id(),
      template: templateChangingNames,
      sharedId: 'shared10',
      type: 'entity',
      language: 'pt',
      title: 'PT',
      creationDate: 1,
      published: true,
      metadata: {
        property1: [{ value: 'value1' }],
        property2: [{ value: 'value2' }],
        property3: [{ value: 'value3' }],
      },
    },
    {
      _id: db.id(),
      template: templateChangingNames,
      sharedId: 'shared10',
      type: 'entity',
      language: 'pt',
      title: 'PT',
      creationDate: 1,
      published: true,
      metadata: {
        property1: [{ value: 'value1' }],
        property2: [{ value: 'value2' }],
        property3: [{ value: 'value3' }],
      },
    },
    //docs using entity as thesauri
    {
      title: 'title',
      _id: db.id(),
      template: templateWithEntityAsThesauri,
      sharedId: 'multiselect',
      type: 'entity',
      language: 'en',
      metadata: { multiselect: [{ value: 'shared' }, { value: 'value0' }] },
    },
    {
      title: 'title',
      _id: db.id(),
      template: templateWithEntityAsThesauri2,
      sharedId: 'multiselect',
      type: 'entity',
      language: 'es',
      metadata: { multiselect2: [{ value: 'shared' }, { value: 'value2' }] },
    },
    {
      title: 'title',
      _id: db.id(),
      template: templateWithEntityAsThesauri,
      sharedId: 'select',
      type: 'entity',
      language: 'en',
      metadata: { select: [{ value: 'shared' }] },
      file: { filename: '123.pdf' },
    },
    {
      title: 'title',
      _id: db.id(),
      template: templateWithEntityAsThesauri2,
      sharedId: 'select',
      type: 'entity',
      language: 'es',
      metadata: { select2: [{ value: 'shared' }] },
      file: { filename: '123.pdf' },
      fullText: { 1: 'text' },
    },
    {
      title: 'title',
      _id: db.id(),
      sharedId: 'otherTemplateWithMultiselect',
      type: 'entity',
      language: 'es',
      metadata: { select2: [{ value: 'value' }] },
      file: { filename: '123.pdf' },
      fullText: { 1: 'text' },
    },
    {
      title: 'title',
      _id: db.id(),
      template: templateWithOnlySelect,
      sharedId: 'otherTemplateWithSelect',
      type: 'entity',
      language: 'es',
      metadata: { select: [{ value: 'shared10' }] },
      file: { filename: '123.pdf' },
      fullText: { 1: 'text' },
    },
    {
      title: 'title',
      _id: db.id(),
      template: templateWithOnlyMultiselect,
      sharedId: 'otherTemplateWithMultiselect',
      type: 'entity',
      language: 'es',
      metadata: { multiselect: [{ value: 'value1' }, { value: 'multiselect' }] },
      file: { filename: '123.pdf' },
    },
    {
      _id: shared2,
      template: templateId,
      sharedId: 'shared2',
      language: 'en',
      title: 'shared2title',
      metadata: {
        property1: [{ value: 'something to be inherited' }],
      },
    },
    { sharedId: 'source2', language: 'en' },
    {
      title: 'entity one',
      sharedId: 'id1',
      language: 'es',
    },
    {
      title: 'entity two',
      sharedId: 'id2',
      language: 'es',
    },
    {
      title: 'entity three',
      sharedId: 'id3',
      language: 'es',
    },
    {
      title: 'entity one',
      sharedId: 'id1',
      language: 'en',
    },
    {
      title: 'entity two',
      sharedId: 'id2',
      language: 'en',
    },
    {
      title: 'entity three',
      sharedId: 'id3',
      language: 'en',
    },
    {
      title: 'value2',
      template: templateId,
      language: 'en',
      sharedId: 'value2',
    },
    {
      title: 'value0',
      template: templateId,
      language: 'en',
      sharedId: 'value0',
    },
    {
      title: 'value1',
      template: templateWithEntityAsThesauri,
      language: 'en',
      sharedId: 'value1',
    },
    {
      _id: db.id(),
      sharedId: 'sharedPerm',
      title: 'Entity With Permissions',
      language: 'es',
      permissions,
    },
    {
      _id: entityGetTestEntityIdA,
      sharedId: 'entityGetTestEntityIdA',
      type: 'entity',
      template: entityGetTestTemplateId,
      language: 'en',
      title: 'TitleA',
      published: true,
      metadata: {
        some_property: [{ value: 'value1' }],
      },
    },
    {
      _id: entityGetTestEntityIdB,
      sharedId: 'entityGetTestEntityIdB',
      type: 'entity',
      template: entityGetTestTemplateId,
      language: 'en',
      title: 'TitleB',
      published: true,
      metadata: {
        some_property: [{ value: 'value2' }],
      },
    },
    {
      _id: entityGetTestEntityIdC,
      sharedId: 'entityGetTestEntityIdC',
      type: 'entity',
      template: entityGetTestTemplateId,
      language: 'en',
      title: 'TitleC',
      published: true,
      metadata: {
        some_property: [{ value: 'value3' }],
      },
    },
  ],
  settings: [
    {
      _id: db.id(),
      languages: [{ key: 'es', default: true }, { key: 'pt' }, { key: 'en' }],
    },
  ],
  templates: [
    {
      _id: templateId,
      name: 'template_test',
      properties: [
        { _id: db.id(), type: 'text', name: 'text' },
        { _id: inheritedProperty, type: 'text', name: 'property1' },
        { _id: db.id(), type: 'text', name: 'property2' },
        { _id: db.id(), type: 'text', name: 'description' },
        { _id: db.id(), type: 'select', name: 'select', content: dictionary },
        { _id: db.id(), type: 'multiselect', name: 'multiselect', content: dictionary },
        { _id: db.id(), type: 'date', name: 'date' },
        { _id: db.id(), type: 'multidate', name: 'multidate' },
        { _id: db.id(), type: 'multidaterange', name: 'multidaterange' },
        { _id: db.id(), type: 'daterange', name: 'daterange' },
        {
          _id: db.id(),
          type: 'relationship',
          name: 'friends',
          relationType: relationType1,
        },
        {
          _id: db.id(),
          type: 'relationship',
          name: 'enemies',
          relationType: relationType4,
          content: templateId.toString(),
          inherit: {
            property: inheritedProperty,
            type: 'text',
          },
        },
        { _id: db.id(), type: 'nested', name: 'field_nested' },
        { _id: db.id(), type: 'numeric', name: 'numeric' },
      ],
    },
    {
      _id: templateWithOnlyMultiselect,
      name: 'templateWithOnlyMultiSelectSelect',
      properties: [
        {
          _id: db.id(),
          type: 'relationship',
          name: 'multiselect',
          content: templateWithEntityAsThesauri.toString(),
        },
      ],
    },
    {
      _id: templateWithOnlySelect,
      name: 'templateWithOnlySelect',
      properties: [
        {
          _id: db.id(),
          type: 'relationship',
          name: 'select',
          content: templateChangingNames.toString(),
        },
      ],
    },
    {
      _id: templateWithEntityAsThesauri,
      name: 'template_with_thesauri_as_template',
      properties: [
        { _id: db.id(), type: 'relationship', name: 'select', content: templateId.toString() },
        { _id: db.id(), type: 'relationship', name: 'multiselect', content: templateId.toString() },
      ],
    },
    {
      _id: templateWithEntityAsThesauri2,
      name: 'template_with_thesauri_as_template',
      properties: [
        {
          _id: db.id(),
          type: 'relationship',
          name: 'select2',
          content: templateId.toString(),
          relationType: relationType1,
        },
        {
          _id: db.id(),
          type: 'relationship',
          name: 'multiselect2',
          content: templateId.toString(),
        },
      ],
    },
    {
      _id: templateChangingNames,
      name: 'template_changing_names',
      default: true,
      properties: [
        { _id: templateChangingNamesProps.prop1id, type: 'text', name: 'property1' },
        { _id: templateChangingNamesProps.prop2id, type: 'text', name: 'property2' },
        { _id: templateChangingNamesProps.prop3id, type: 'text', name: 'property3' },
      ],
    },
    {
      _id: entityGetTestTemplateId,
      name: 'entityGetTestTemplate',
      properties: [{ _id: db.id(), type: 'text', name: 'some_property' }],
    },
  ],
  connections: [
    { _id: referenceId, entity: 'shared', template: null, hub: hub1, entityData: {} },
    { _id: db.id(), entity: 'shared2', template: relationType1, hub: hub1, entityData: {} },
    { _id: db.id(), entity: 'shared', template: null, hub: hub2, entityData: {} },
    { _id: db.id(), entity: 'source2', template: relationType2, hub: hub2, entityData: {} },
    { _id: db.id(), entity: 'another', template: relationType3, hub: hub3, entityData: {} },
    { _id: db.id(), entity: 'document', template: relationType3, hub: hub3, entityData: {} },
    { _id: db.id(), entity: 'shared', template: relationType2, hub: hub4, entityData: {} },
    { _id: db.id(), entity: 'shared1', template: relationType2, hub: hub4, entityData: {} },
    { _id: db.id(), entity: 'shared1', template: relationType2, hub: hub5, entityData: {} },
    { _id: db.id(), entity: 'shared', template: relationType2, hub: hub5, entityData: {} },
    { _id: db.id(), entity: 'relSaveTest', template: null, hub: hub6 },
    { _id: db.id(), entity: 'shared2', template: relationType1, hub: hub6 },
    { _id: db.id(), entity: 'relSaveTest', template: null, hub: hub7 },
    { _id: db.id(), entity: 'shared2', template: relationType4, hub: hub7 },
  ],
  dictionaries: [
    {
      _id: dictionary,
      name: 'Countries',
      values: [
        { _id: db.id(), id: 'country_one', label: 'Country1' },
        { _id: db.id(), id: 'country_two', label: 'Country2' },
        {
          id: 'towns',
          label: 'Towns',
          values: [
            { id: 'town1', label: 'Town1' },
            { id: 'town2', label: 'Town2' },
          ],
        },
      ],
    },
  ],
  translationsV2: [
    {
      language: 'pt',
      key: 'town2',
      value: 'Ciudad2_pt',
      context: { id: dictionary.toString(), type: 'Thesauri', label: 'dictionary' },
    },
    {
      language: 'pt',
      key: 'town1',
      value: 'Ciudad1_pt',
      context: { id: dictionary.toString(), type: 'Thesauri', label: 'dictionary' },
    },
    {
      language: 'pt',
      key: 'towns',
      value: 'Ciudades_pt',
      context: { id: dictionary.toString(), type: 'Thesauri', label: 'dictionary' },
    },
    {
      language: 'pt',
      key: 'Country2',
      value: 'Pais2_pt',
      context: { id: dictionary.toString(), type: 'Thesauri', label: 'dictionary' },
    },
    {
      language: 'pt',
      key: 'Country1',
      value: 'Pais1_pt',
      context: { id: dictionary.toString(), type: 'Thesauri', label: 'dictionary' },
    },
    {
      language: 'es',
      key: 'town2',
      value: 'Ciudad2',
      context: { id: dictionary.toString(), type: 'Thesauri', label: 'dictionary' },
    },
    {
      language: 'es',
      key: 'town1',
      value: 'Ciudad1',
      context: { id: dictionary.toString(), type: 'Thesauri', label: 'dictionary' },
    },
    {
      language: 'es',
      key: 'towns',
      value: 'Ciudades',
      context: { id: dictionary.toString(), type: 'Thesauri', label: 'dictionary' },
    },
    {
      language: 'es',
      key: 'Country2',
      value: 'Pais2',
      context: { id: dictionary.toString(), type: 'Thesauri', label: 'dictionary' },
    },
    {
      language: 'es',
      key: 'Country1',
      value: 'Pais1',
      context: { id: dictionary.toString(), type: 'Thesauri', label: 'dictionary' },
    },
    {
      language: 'en',
      key: 'town2',
      value: 'Town2',
      context: { id: dictionary.toString(), type: 'Thesauri', label: 'dictionary' },
    },
    {
      language: 'en',
      key: 'town1',
      value: 'Town1',
      context: { id: dictionary.toString(), type: 'Thesauri', label: 'dictionary' },
    },
    {
      language: 'en',
      key: 'towns',
      value: 'Towns',
      context: { id: dictionary.toString(), type: 'Thesauri', label: 'dictionary' },
    },
    {
      language: 'en',
      key: 'Country2',
      value: 'Country2',
      context: { id: dictionary.toString(), type: 'Thesauri', label: 'dictionary' },
    },
    {
      language: 'en',
      key: 'Country1',
      value: 'Country1',
      context: { id: dictionary.toString(), type: 'Thesauri', label: 'dictionary' },
    },
  ],

  ixsuggestions: [
    {
      _id: db.id(),
      entityId: 'shared',
      propertyName: 'title',
      extractorId: fixtureFactory.id('extractor'),
      suggestedValue: 'different title',
      segment: 'different title',
      language: 'en',
      date: 5,
      page: 2,
    },
    {
      _id: db.id(),
      entityId: 'other',
      propertyName: 'title',
      extractorId: fixtureFactory.id('extractor'),
      suggestedValue: 'other title',
      segment: 'other title',
      language: 'en',
      date: 3,
      page: 1,
    },
  ],
};

export {
  adminId,
  batmanFinishesId,
  batmanStillNotDoneId,
  syncPropertiesEntityId,
  templateId,
  templateChangingNames,
  templateChangingNamesProps,
  templateWithEntityAsThesauri,
  docId1,
  shared2,
  docId2,
  c1,
  c2,
  unpublishedDocId,
  uploadId1,
  uploadId2,
  permissions,
  entityGetTestTemplateId,
};
