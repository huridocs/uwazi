import db from 'api/utils/testing_db';

const dictAId = db.id();
const dictBId = db.id();

const relTypeId = db.id();

const unrelatedTemplateId = db.id();

const selectTemplateId = db.id();
const selectPropertyId = db.id();

const multiSelectTemplateId = db.id();
const multiSelectPropertyId = db.id();

const inheritingTemplateId = db.id();

const commonProperties = [
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
];

const fixtures = {
  dictionaries: [
    {
      _id: dictAId,
      name: 'Dictionary A',
      values: [
        {
          label: 'A_root_1',
          id: 'A_root_1_id',
        },
        {
          label: 'A_root_2',
          id: 'A_root_2_id',
        },
        {
          label: 'A good_group',
          id: 'A_good_group_id',
          values: [
            {
              label: 'A_good_group_child_1',
              id: 'A_good_group_child_1_id',
            },
          ],
        },
        {
          label: 'A bad_group',
          id: 'A_bad_group_id',
          values: [
            {
              label: 'A_bad_group_good_child',
              id: 'A_bad_group_good_child_id',
            },
            {
              label: 'A_bad_group_bad_child',
              id: 'A_bad_group_id', // same as parent
            },
          ],
        },
      ],
    },
    {
      _id: dictBId,
      name: 'Dictionary B',
      values: [
        {
          label: 'B_root_1',
          id: 'B_root_1_id',
        },
        {
          label: 'B_root_2',
          id: 'B_root_2_id',
        },
        {
          label: 'B good_group',
          id: 'B_good_group_id',
          values: [
            {
              label: 'B_good_group_child_1',
              id: 'B_good_group_child_1_id',
            },
          ],
        },
        {
          label: 'B bad_group',
          id: 'B_bad_group_id',
          values: [
            {
              label: 'B_bad_group_good_child',
              id: 'B_bad_group_good_child_id',
            },
            {
              label: 'B_bad_group_bad_child',
              id: 'B_bad_group_id', // same as parent
            },
          ],
        },
        {
          label: 'B bad_group_2',
          id: 'B_bad_group_2_id',
          values: [
            {
              label: 'B_bad_group_2_good_child',
              id: 'B_bad_group_2_good_child_id',
            },
            {
              label: 'B_bad_group_2_bad_child',
              id: 'B_bad_group_2_id', // same as parent
            },
          ],
        },
      ],
    },
  ],
  relationtypes: [
    {
      _id: relTypeId,
      name: 'relation_type',
    },
  ],
  templates: [
    {
      _id: unrelatedTemplateId,
      name: 'unrelated_template',
      commonProperties,
      properties: [
        {
          _id: db.id(),
          label: 'A Text',
          type: 'text',
          name: 'a_text',
        },
      ],
    },
    {
      _id: selectTemplateId,
      name: 'template_with_a_select',
      commonProperties,
      properties: [
        {
          _id: selectPropertyId,
          label: 'A Select',
          type: 'select',
          name: 'a_select',
          content: dictAId.toString(),
        },
        {
          _id: db.id(),
          label: 'Another Text',
          type: 'text',
          name: 'another_text',
        },
      ],
    },
    {
      _id: multiSelectTemplateId,
      name: 'template_with_a_multiselect',
      commonProperties,
      properties: [
        {
          _id: multiSelectPropertyId,
          label: 'A MultiSelect',
          type: 'multiselect',
          name: 'a_multiselect',
          content: dictBId.toString(),
        },
        {
          _id: db.id(),
          label: 'A Number',
          type: 'numeric',
          name: 'a_number',
        },
      ],
    },
    {
      _id: inheritingTemplateId,
      name: 'template_inheriting',
      commonProperties,
      properties: [
        {
          _id: db.id(),
          label: 'inherited select',
          type: 'relationship',
          name: 'inherited_select',
          content: selectTemplateId.toString(),
          relationType: relTypeId.toString(),
          inherit: {
            property: selectPropertyId.toString(),
            type: 'select',
          },
        },
        {
          _id: db.id(),
          label: 'inherited multiselect',
          type: 'relationship',
          name: 'inherited_multiselect',
          content: multiSelectTemplateId.toString(),
          relationType: relTypeId.toString(),
          inherit: {
            property: multiSelectPropertyId.toString(),
            type: 'multiselect',
          },
        },
        {
          _id: db.id(),
          label: 'Another Number',
          type: 'numeric',
          name: 'another_number',
        },
      ],
    },
  ],
  entities: [
    {
      title: 'no_metadata_entity',
      language: 'en',
      mongoLanguage: 'en',
      sharedId: 'no_metadata_entity',
      template: unrelatedTemplateId,
      published: false,
    },
    {
      title: 'empty_entity',
      language: 'en',
      mongoLanguage: 'en',
      sharedId: 'empty_entity',
      template: unrelatedTemplateId,
      published: false,
      metadata: {},
    },
    {
      title: 'unrelated_entity',
      language: 'en',
      mongoLanguage: 'en',
      sharedId: 'unrelated_entity',
      template: unrelatedTemplateId,
      published: false,
      metadata: {
        a_text: [{ value: 'a text value' }],
      },
    },
    {
      title: 'select_entity',
      language: 'en',
      mongoLanguage: 'en',
      sharedId: 'select_entity',
      template: selectTemplateId,
      published: false,
      metadata: {
        a_select: [
          {
            label: 'A_bad_group_bad_child',
            value: 'A_bad_group_id',
            parent: {
              label: 'A bad_group',
              value: 'A_bad_group_id',
            },
          },
        ],
        another_text: [{ value: 'another text value' }],
      },
    },
    {
      title: 'select_entity_good',
      language: 'en',
      mongoLanguage: 'en',
      sharedId: 'select_entity_good',
      template: selectTemplateId,
      published: false,
      metadata: {
        a_select: [
          {
            label: 'A_bad_group_good_child',
            value: 'A_bad_group_good_child_id',
            parent: {
              label: 'A bad_group',
              value: 'A_bad_group_id',
            },
          },
        ],
        another_text: [{ value: 'another text value' }],
      },
    },
    {
      title: 'multiselect_entity',
      language: 'en',
      mongoLanguage: 'en',
      sharedId: 'multiselect_entity',
      template: multiSelectTemplateId,
      published: false,
      metadata: {
        a_multiselect: [
          {
            label: 'B_root_1',
            value: 'B_root_1_id',
          },
          {
            label: 'B_good_group_child_1',
            value: 'B_good_group_child_1_id',
            parent: {
              label: 'B good_group',
              value: 'B_good_group_id',
            },
          },
          {
            label: 'B_bad_group_good_child',
            value: 'B_bad_group_good_child_id',
            parent: {
              label: 'B bad_group',
              value: 'B_bad_group_id',
            },
          },
          {
            label: 'B_bad_group_bad_child',
            value: 'B_bad_group_id',
            parent: {
              label: 'B bad_group',
              value: 'B_bad_group_id',
            },
          },
        ],
        a_number: [{ value: 0 }],
      },
    },
    {
      title: 'inheriting_entity',
      language: 'en',
      mongoLanguage: 'en',
      sharedId: 'inheriting_entity',
      template: inheritingTemplateId,
      published: false,
      metadata: {
        inherited_select: [
          {
            value: 'some_sharedId_A',
            label: 'some title A',
            type: 'entity',
            inheritedType: 'select',
            inheritedValue: [
              {
                label: 'A_bad_group_bad_child',
                value: 'A_bad_group_id',
                parent: {
                  label: 'A bad_group',
                  value: 'A_bad_group_id',
                },
              },
            ],
          },
          {
            value: 'some_sharedId_B',
            label: 'some title B',
            type: 'entity',
            inheritedType: 'select',
            inheritedValue: [
              {
                label: 'A_bad_group_good_child',
                value: 'A_bad_group_good_child_id',
                parent: {
                  label: 'A bad_group',
                  value: 'A_bad_group_id',
                },
              },
            ],
          },
        ],
        inherited_multiselect: [
          {
            value: 'some_sharedId_C',
            label: 'some title C',
            type: 'entity',
            inheritedType: 'multiselect',
            inheritedValue: [
              {
                label: 'B_bad_group_bad_child',
                value: 'B_bad_group_id',
                parent: {
                  label: 'B bad_group',
                  value: 'B_bad_group_id',
                },
              },
            ],
          },
          {
            value: 'some_sharedId_D',
            label: 'some title D',
            type: 'entity',
            inheritedType: 'multiselect',
            inheritedValue: [
              {
                label: 'B_root_1',
                value: 'B_root_1_id',
              },
              {
                label: 'B_good_group_child_1',
                value: 'B_good_group_child_1_id',
                parent: {
                  label: 'B good_group',
                  value: 'B_good_group_id',
                },
              },
              {
                label: 'B_bad_group_good_child',
                value: 'B_bad_group_good_child_id',
                parent: {
                  label: 'B bad_group',
                  value: 'B_bad_group_id',
                },
              },
              {
                label: 'B_bad_group_2_bad_child',
                value: 'B_bad_group_2_id',
                parent: {
                  label: 'B bad_group_2',
                  value: 'B_bad_group_2_id',
                },
              },
            ],
          },
        ],
        another_number: [{ value: 0 }],
      },
    },
  ],
};

export {
  dictAId,
  dictBId,
  fixtures,
  unrelatedTemplateId,
  selectTemplateId,
  multiSelectTemplateId,
  inheritingTemplateId,
};
