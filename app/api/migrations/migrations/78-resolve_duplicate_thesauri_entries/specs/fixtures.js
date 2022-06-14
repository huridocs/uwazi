import db from 'api/utils/testing_db';

const adminUserId = db.id();
const thesaurusId = db.id();
const selectPropertyId = db.id();
const multiselectPropertyId = db.id();
const selectRelationId = db.id();
const multiselectRelationId = db.id();
const rootTemplate = db.id();
const inheritingTemplate = db.id();
const syncedTemplate = db.id();
const rootSharedId = 'root_entity_sharedId';

const selectValue = [{ value: 'C_3_id', label: 'C' }];
const multiSelectValues = [
  { value: 'A_2_id', label: 'A' },
  { value: 'B_id', label: 'B' },
  { value: 'C_id', label: 'C' },
  { value: 'C_2_id', label: 'C' },
  { value: 'C_3_id', label: 'C' },
  { value: 'group_B_id', label: 'B', parent: { value: 'group_1_id', label: 'group_1' } },
  { value: 'group_A_id', label: 'A', parent: { value: 'group_1_id', label: 'group_1' } },
  { value: 'group_A_2_id', label: 'A', parent: { value: 'group_1_id', label: 'group_1' } },
  { value: 'group_D_id', label: 'D', parent: { value: 'A_group_id', label: 'A' } },
];

export default {
  dictionaries: [
    {
      _id: thesaurusId,
      name: 'test_thesaurus',
      values: [
        { label: 'A', id: 'A_id' },
        { label: 'B', id: 'B_id' },
        { label: 'A', id: 'A_2_id' },
        {
          label: 'group_1',
          id: 'group_1_id',
          values: [
            { label: 'A', id: 'group_A_id' },
            { label: 'B', id: 'group_B_id' },
            { label: 'A', id: 'group_A_2_id' },
          ],
        },
        { label: 'C', id: 'C_id' },
        { label: 'C', id: 'C_2_id' },
        { label: 'C', id: 'C_3_id' },
        {
          label: 'A',
          id: 'A_group_id',
          values: [{ label: 'D', id: 'group_D_id' }],
        },
      ],
    },
  ],
  relationtypes: [
    { _id: selectRelationId, name: 'select_rel' },
    { _id: multiselectRelationId, name: 'multiselect_rel' },
  ],
  templates: [
    {
      _id: rootTemplate,
      name: 'root_template',
      properties: [
        {
          _id: selectPropertyId,
          label: 'Select',
          type: 'select',
          content: thesaurusId.toString(),
          name: 'select',
        },
        { label: 'Text', type: 'text', name: 'select' },
        {
          _id: multiselectPropertyId,
          label: 'Multi Select',
          type: 'multiselect',
          content: thesaurusId.toString(),
          name: 'multi_select',
        },
      ],
      commonProperties: [
        {
          label: 'Title',
          name: 'title',
          isCommonProperty: true,
          type: 'text',
        },
        {
          label: 'Date added',
          name: 'creationDate',
          isCommonProperty: true,
          type: 'date',
        },
        {
          label: 'Date modified',
          name: 'editDate',
          isCommonProperty: true,
          type: 'date',
        },
      ],
    },
    {
      _id: inheritingTemplate,
      name: 'inheriting_template',
      properties: [
        {
          label: 'inherited select',
          type: 'relationship',
          inherit: {
            property: selectPropertyId.toString(),
            type: 'select',
          },
          content: rootTemplate.toString(),
          relationType: selectRelationId.toString(),
          name: 'inherited_select',
        },
        { label: 'Number', type: 'numeric', name: 'number' },
        {
          label: 'inherited_multiselect',
          type: 'relationship',
          inherit: {
            property: multiselectPropertyId.toString(),
            type: 'multiselect',
          },
          content: rootTemplate.toString(),
          relationType: multiselectRelationId.toString(),
          name: 'inherited_multiselect',
        },
      ],
      commonProperties: [
        {
          label: 'Title',
          name: 'title',
          isCommonProperty: true,
          type: 'text',
        },
        {
          label: 'Date added',
          name: 'creationDate',
          isCommonProperty: true,
          type: 'date',
        },
        {
          label: 'Date modified',
          name: 'editDate',
          isCommonProperty: true,
          type: 'date',
        },
      ],
    },
    {
      _id: syncedTemplate,
      name: 'synced_template',
      synced: true,
      properties: [
        {
          label: 'inherited_select_with_nonsynced_source',
          type: 'relationship',
          inherit: {
            property: db.id().toString(),
            type: 'select',
          },
          content: db.id().toString(),
          relationType: selectRelationId.toString(),
          name: 'inherited_select_with_nonsynced_source',
        },
      ],
      commonProperties: [
        {
          label: 'Title',
          name: 'title',
          isCommonProperty: true,
          type: 'text',
        },
        {
          label: 'Date added',
          name: 'creationDate',
          isCommonProperty: true,
          type: 'date',
        },
        {
          label: 'Date modified',
          name: 'editDate',
          isCommonProperty: true,
          type: 'date',
        },
      ],
    },
  ],
  users: [
    {
      _id: adminUserId,
      password: 'some_hash',
      username: 'admin',
      email: 'admin@service.xyz',
      role: 'admin',
    },
  ],
  entities: [
    {
      metadata: {
        select: selectValue,
        text: { value: 'some text' },
        multi_select: multiSelectValues,
      },
      template: rootTemplate,
      title: 'root_entity',
      user: adminUserId,
      language: 'en',
      sharedId: rootSharedId,
      mongoLanguage: 'en',
    },
    {
      metadata: {
        inherited_select: [
          {
            value: rootSharedId,
            label: 'root_entity',
            type: 'entity',
            inheritedValue: selectValue,
            inheritedType: 'select',
          },
        ],
        number: { value: 0 },
        inherited_multiselect: [
          {
            value: rootSharedId,
            label: 'root_entity',
            type: 'entity',
            inheritedValue: multiSelectValues,
            inheritedType: 'multiselect',
          },
        ],
      },
      template: inheritingTemplate,
      title: 'inheriting entity',
      user: adminUserId,
      language: 'en',
      sharedId: 'inheriting_shared_id',
      mongoLanguage: 'en',
    },
    {
      metadata: {
        inherited_select_with_nonsynced_source: [
          {
            value: 'nonsynced_entity_sharedId',
            label: 'nonsynced_entity_sharedId_title',
            type: 'entity',
            inheritedValue: [{ value: 'nonsynced_value', label: 'nonsynced_label' }],
            inheritedType: 'select',
          },
        ],
      },
      template: syncedTemplate,
      title: 'entity inheriting from nonsynced sources',
      user: adminUserId,
      language: 'en',
      sharedId: 'inheriting_nonsynced__shared_id',
      mongoLanguage: 'en',
    },
  ],
};
