/* eslint-disable max-lines */
import db from 'api/utils/testing_db';

const letterThesaurusId = db.id();

const UserBluePrints = {
  admin: {
    _id: db.id(),
    password: 'hashed_admin_pass',
    email: 'admin@email.service',
    role: 'admin',
  },
};

const RelationTypeIds = {
  FromNumber: db.id(),
  FromText: db.id(),
  FromSelect: db.id(),
  FromMultiSelect: db.id(),
  NotInherited: db.id(),
};

const PropertyIds = {
  text: db.id(),
  number: db.id(),
  select: db.id(),
  multiselect: db.id(),
};
const TemplateBluePrints = {
  NotTranslatableProperties: {
    _id: db.id(),
    name: 'NotTranslatableProperties',
  },
  ThesauriRelatedProperties: {
    _id: db.id(),
    name: 'ThesauriRelatedProperties',
  },
  WithRelationships: {
    _id: db.id(),
    name: 'WithRelationships',
  },
};

const EntityBluePrints = {
  Complete: {
    title: 'CompleteExampleEnglish',
    metadata: {
      text: [{ value: 'complete_example_text_english' }],
      numeric: [{ value: 1 }],
      date_range: [{ value: { from: 1, to: 2 } }],
      multi_date: [{ value: 1 }, { value: 2 }],
    },
    template: TemplateBluePrints.NotTranslatableProperties._id,
    user: UserBluePrints.admin._id,
    creationDate: 1,
    published: true,
    editDate: 2,
    language: 'en',
    sharedId: 'complete_sharedId',
    mongoLanguage: 'en',
    permissions: [{ refId: UserBluePrints.admin._id.toString(), type: 'user', level: 'write' }],
  },
  CompleteSelects: {
    title: 'CompleteSelectsEnglish',
    metadata: {
      select: [{ value: 'AId', label: 'A' }],
      multi_select: [
        { value: 'BId', label: 'B' },
        { value: 'DId', label: 'D' },
      ],
    },
    template: TemplateBluePrints.ThesauriRelatedProperties._id,
    user: UserBluePrints.admin._id,
    creationDate: 3,
    published: false,
    editDate: 4,
    language: 'en',
    sharedId: 'complete_selects_sharedId',
    mongoLanguage: 'en',
    permissions: [{ refId: UserBluePrints.admin._id.toString(), type: 'user', level: 'write' }],
  },
  MissingOne: {
    title: 'MissingOneEnglish',
    metadata: {
      text: [{ value: 'missing_one_text_english' }],
      numeric: [{ value: 2 }],
      date_range: [{ value: { from: 2, to: 3 } }],
      multi_date: [{ value: 2 }, { value: 3 }],
    },
    template: TemplateBluePrints.NotTranslatableProperties._id,
    user: UserBluePrints.admin._id,
    creationDate: 2,
    published: true,
    editDate: 3,
    language: 'en',
    sharedId: 'missing_one_sharedId',
    mongoLanguage: 'en',
    permissions: [{ refId: UserBluePrints.admin._id.toString(), type: 'user', level: 'write' }],
  },
  MissingTwo: {
    title: 'MissingTwoSpanish',
    metadata: {
      text: [{ value: 'missing_two_text_spanish' }],
      numeric: [{ value: 3 }],
      date_range: [{ value: { from: 3, to: 4 } }],
      multi_date: [{ value: 3 }, { value: 4 }],
    },
    template: TemplateBluePrints.NotTranslatableProperties._id,
    user: UserBluePrints.admin._id,
    creationDate: 3,
    published: false,
    editDate: 4,
    language: 'es',
    sharedId: 'missing_two_sharedId',
    mongoLanguage: 'es',
    permissions: [{ refId: UserBluePrints.admin._id.toString(), type: 'user', level: 'write' }],
  },
  MissingTwoSelects: {
    title: 'MissingTwoSelectsPortuguese',
    metadata: {
      select: [{ value: 'BId', label: 'B_pt' }],
      multi_select: [
        { value: 'AId', label: 'A_pt' },
        { value: 'CId', label: 'C_pt' },
      ],
    },
    template: TemplateBluePrints.ThesauriRelatedProperties._id,
    user: UserBluePrints.admin._id,
    creationDate: 4,
    published: false,
    editDate: 5,
    language: 'pt',
    sharedId: 'missing_two_selects_sharedId',
    mongoLanguage: 'pt',
    permissions: [{ refId: UserBluePrints.admin._id.toString(), type: 'user', level: 'write' }],
  },
  MissingOneRels: {
    title: 'MissingOneRelationshipsEnglish',
    template: TemplateBluePrints.WithRelationships._id,
    user: UserBluePrints.admin._id,
    creationDate: 5,
    published: true,
    editDate: 6,
    language: 'en',
    sharedId: 'missing_one_rels_sharedId',
    mongoLanguage: 'en',
    permissions: [{ refId: UserBluePrints.admin._id.toString(), type: 'user', level: 'write' }],
  },
  MissingTwoRels: {
    title: 'MissingTwoRelationshipsPortuguese',
    template: TemplateBluePrints.WithRelationships._id,
    user: UserBluePrints.admin._id,
    creationDate: 5,
    published: true,
    editDate: 6,
    language: 'pt',
    sharedId: 'missing_two_rels_sharedId',
    mongoLanguage: 'pt',
    permissions: [{ refId: UserBluePrints.admin._id.toString(), type: 'user', level: 'write' }],
  },
  NoLanguage: {
    title: 'FaultyEntityWithoutLanguage',
    template: TemplateBluePrints.ThesauriRelatedProperties._id,
    user: UserBluePrints.admin._id,
    creationDate: 6,
    published: false,
    editDate: 7,
    sharedId: 'faulty_sharedId',
  },
};

const fixtures = {
  users: [{ ...UserBluePrints.admin }],
  settings: [
    {
      languages: [
        { default: true, label: 'English', key: 'en' },
        { label: 'Spanish', key: 'es' },
        { label: 'Portuguese', key: 'pt' },
      ],
    },
  ],
  dictionaries: [
    {
      _id: letterThesaurusId,
      name: 'letters',
      values: [
        { label: 'A', id: 'AId' },
        { label: 'B', id: 'BId' },
        { label: 'C', id: 'CId' },
        { label: 'D', id: 'DId' },
      ],
    },
  ],
  translations: [
    {
      locale: 'en',
      contexts: [
        {
          id: letterThesaurusId.toString(),
          label: 'letter',
          values: [
            {
              key: 'letter',
              value: 'letter',
            },
            { key: 'A', value: 'A' },
            { key: 'B', value: 'B' },
            { key: 'C', value: 'C' },
            { key: 'D', value: 'D' },
          ],
          type: 'Thesaurus',
        },
      ],
    },
    {
      locale: 'es',
      contexts: [
        {
          id: letterThesaurusId.toString(),
          label: 'letter',
          values: [
            {
              key: 'letter',
              value: 'letter',
            },
            { key: 'A', value: 'A_es' },
            { key: 'B', value: 'B_es' },
            { key: 'C', value: 'C_es' },
            { key: 'D', value: 'D_es' },
          ],
          type: 'Thesaurus',
        },
      ],
    },
    {
      locale: 'pt',
      contexts: [
        {
          id: letterThesaurusId.toString(),
          label: 'letter',
          values: [
            {
              key: 'letter',
              value: 'letter',
            },
            { key: 'A', value: 'A_pt' },
            { key: 'B', value: 'B_pt' },
            { key: 'C', value: 'C_pt' },
            { key: 'D', value: 'D_pt' },
          ],
          type: 'Thesaurus',
        },
      ],
    },
  ],
  relationtypes: [
    { _id: RelationTypeIds.FromNumber, name: 'FromNumber' },
    { _id: RelationTypeIds.FromText, name: 'FromText' },
    { _id: RelationTypeIds.FromSelect, name: 'FromSelect' },
    { _id: RelationTypeIds.FromMultiSelect, name: 'FromMultiSelect' },
    { _id: RelationTypeIds.NotInherited, name: 'NotInherited' },
  ],
  templates: [
    {
      ...TemplateBluePrints.NotTranslatableProperties,
      properties: [
        {
          _id: PropertyIds.text,
          label: 'Text',
          type: 'text',
          name: 'text',
        },
        {
          _id: PropertyIds.number,
          label: 'Numeric',
          type: 'numeric',
          name: 'numeric',
        },
        {
          label: 'Date Range',
          type: 'daterange',
          name: 'date_range',
        },
        {
          label: 'Multi Date',
          type: 'multidate',
          name: 'multi_date',
        },
      ],
      commonProperties: [
        {
          label: 'Title',
          name: 'title',
          type: 'text',
        },
        {
          label: 'Date added',
          name: 'creationDate',
          type: 'date',
        },
        {
          label: 'Date modified',
          name: 'editDate',
          type: 'date',
        },
      ],
    },
    {
      ...TemplateBluePrints.ThesauriRelatedProperties,
      properties: [
        {
          _id: PropertyIds.select,
          label: 'Select',
          type: 'select',
          name: 'select',
          content: letterThesaurusId.toString(),
        },
        {
          _id: PropertyIds.multiselect,
          label: 'Multi Select',
          type: 'multiselect',
          name: 'multi_select',
          content: letterThesaurusId.toString(),
        },
      ],
      commonProperties: [
        {
          label: 'Title',
          name: 'title',
          type: 'text',
        },
        {
          label: 'Date added',
          name: 'creationDate',
          type: 'date',
        },
        {
          label: 'Date modified',
          name: 'editDate',
          type: 'date',
        },
      ],
    },
    {
      ...TemplateBluePrints.WithRelationships,
      properties: [
        {
          label: 'Inherited Text',
          type: 'relationship',
          inherit: { property: PropertyIds.text.toString(), type: 'text' },
          content: TemplateBluePrints.NotTranslatableProperties._id.toString(),
          relationType: RelationTypeIds.FromText.toString(),
          name: 'inherited_text',
        },
        {
          label: 'Inherited Number',
          type: 'relationship',
          inherit: { property: PropertyIds.number.toString(), type: 'numeric' },
          content: TemplateBluePrints.NotTranslatableProperties._id.toString(),
          relationType: RelationTypeIds.FromNumber.toString(),
          name: 'inherited_number',
        },
        {
          label: 'Inherited Select',
          type: 'relationship',
          inherit: { property: PropertyIds.select.toString(), type: 'select' },
          content: TemplateBluePrints.ThesauriRelatedProperties._id.toString(),
          relationType: RelationTypeIds.FromMultiSelect.toString(),
          name: 'inherited_select',
        },
        {
          label: 'Inherited Multi Select',
          type: 'relationship',
          inherit: { property: PropertyIds.multiselect.toString(), type: 'multiselect' },
          content: TemplateBluePrints.ThesauriRelatedProperties._id.toString(),
          relationType: RelationTypeIds.FromMultiSelect.toString(),
          name: 'inherited_multi_select',
        },
        {
          label: 'No Inheritance',
          type: 'relationship',
          content: TemplateBluePrints.NotTranslatableProperties._id.toString(),
          relationType: RelationTypeIds.NotInherited.toString(),
          name: 'no_inheritance',
        },
      ],
      commonProperties: [
        {
          label: 'Title',
          name: 'title',
          type: 'text',
        },
        {
          label: 'Date added',
          name: 'creationDate',
          type: 'date',
        },
        {
          label: 'Date modified',
          name: 'editDate',
          type: 'date',
        },
      ],
    },
  ],
  entities: [
    { ...EntityBluePrints.Complete },
    {
      ...EntityBluePrints.Complete,
      title: 'CompleteExampleSpanish',
      language: 'es',
      mongoLanguage: 'es',
      metadata: {
        ...EntityBluePrints.Complete.metadata,
        text: [{ value: 'complete_example_text_spanish' }],
      },
    },
    {
      ...EntityBluePrints.Complete,
      title: 'CompleteExamplePortuguese',
      language: 'pt',
      mongoLanguage: 'pt',
      metadata: {
        ...EntityBluePrints.Complete.metadata,
        text: [{ value: 'complete_example_text_portuguese' }],
      },
    },
    { ...EntityBluePrints.CompleteSelects },
    {
      ...EntityBluePrints.CompleteSelects,
      title: 'CompleteSelectsSpanish',
      language: 'es',
      mongoLanguage: 'es',
      metadata: {
        select: [{ value: 'AId', label: 'A_es' }],
        multi_select: [
          { value: 'BId', label: 'B_es' },
          { value: 'DId', label: 'D_es' },
        ],
      },
    },
    {
      ...EntityBluePrints.CompleteSelects,
      title: 'CompleteSelectsPortuguese',
      language: 'pt',
      mongoLanguage: 'pt',
      metadata: {
        select: [{ value: 'AId', label: 'A_pt' }],
        multi_select: [
          { value: 'BId', label: 'B_pt' },
          { value: 'DId', label: 'D_pt' },
        ],
      },
    },
    { ...EntityBluePrints.MissingOne },
    { ...EntityBluePrints.MissingOne },
    {
      ...EntityBluePrints.MissingOne,
      title: 'MissingOnePortuguese',
      language: 'pt',
      mongoLanguage: 'pt',
      metadata: {
        ...EntityBluePrints.MissingOne.metadata,
        text: [{ value: 'missing_one_text_portuguese' }],
      },
    },
    { ...EntityBluePrints.MissingTwo },
    { ...EntityBluePrints.MissingTwoSelects },
    {
      ...EntityBluePrints.MissingOneRels,
      metadata: {
        inherited_text: [
          {
            value: EntityBluePrints.Complete.sharedId,
            label: EntityBluePrints.Complete.title,
            type: 'entity',
            inheritedValue: EntityBluePrints.Complete.metadata.text,
            inheritedType: 'text',
          },
        ],
        inherited_number: [],
        inherited_select: [
          {
            value: EntityBluePrints.CompleteSelects.sharedId,
            label: EntityBluePrints.CompleteSelects.title,
            type: 'entity',
            inheritedValue: EntityBluePrints.CompleteSelects.metadata.select,
            inheritedType: 'select',
          },
        ],
        inherited_multi_select: [
          {
            value: EntityBluePrints.CompleteSelects.sharedId,
            label: EntityBluePrints.CompleteSelects.title,
            type: 'entity',
            inheritedValue: EntityBluePrints.CompleteSelects.metadata.multi_select,
            inheritedType: 'multiselect',
          },
        ],
        no_inheritance: [
          {
            value: EntityBluePrints.Complete.sharedId,
            label: EntityBluePrints.Complete.title,
            type: 'entity',
          },
        ],
      },
    },
    { ...EntityBluePrints.NoLanguage },
    //intentional duplication to smoke test faulty behavior:
    { ...EntityBluePrints.Complete, _id: db.id() },
  ],
};
fixtures.entities.push({
  ...EntityBluePrints.MissingOneRels,
  title: 'MissingOneRelationshipsSpanish',
  metadata: {
    inherited_text: [
      {
        value: EntityBluePrints.Complete.sharedId,
        label: fixtures.entities[1].title,
        type: 'entity',
        inheritedValue: fixtures.entities[1].metadata.text,
        inheritedType: 'text',
      },
    ],
    inherited_number: [],
    inherited_select: [
      {
        value: EntityBluePrints.CompleteSelects.sharedId,
        label: fixtures.entities[4].title,
        type: 'entity',
        inheritedValue: fixtures.entities[4].metadata.select,
        inheritedType: 'select',
      },
    ],
    inherited_multi_select: [
      {
        value: EntityBluePrints.CompleteSelects.sharedId,
        label: fixtures.entities[4].title,
        type: 'entity',
        inheritedValue: fixtures.entities[4].metadata.multi_select,
        inheritedType: 'multiselect',
      },
    ],
    no_inheritance: [
      {
        value: EntityBluePrints.Complete.sharedId,
        label: fixtures.entities[1].title,
        type: 'entity',
      },
    ],
  },
  language: 'es',
  mongoLanguage: 'es',
});
fixtures.entities.push({
  ...EntityBluePrints.MissingTwoRels,
  metadata: {
    inherited_text: [
      {
        value: EntityBluePrints.MissingOne.sharedId,
        label: fixtures.entities[8].title,
        type: 'entity',
        inheritedValue: fixtures.entities[8].metadata.text,
        inheritedType: 'text',
      },
    ],
    inherited_number: [
      {
        value: EntityBluePrints.MissingOne.sharedId,
        label: fixtures.entities[8].title,
        type: 'entity',
        inheritedValue: fixtures.entities[8].metadata.numeric,
        inheritedType: 'numeric',
      },
    ],
    inherited_select: [
      {
        value: EntityBluePrints.MissingTwoSelects.sharedId,
        label: EntityBluePrints.MissingTwoSelects.title,
        type: 'entity',
        inheritedValue: EntityBluePrints.MissingTwoSelects.metadata.select,
        inheritedType: 'select',
      },
    ],
    inherited_multi_select: [
      {
        value: EntityBluePrints.CompleteSelects.sharedId,
        label: EntityBluePrints.CompleteSelects.title,
        type: 'entity',
        inheritedValue: EntityBluePrints.CompleteSelects.metadata.multi_select,
        inheritedType: 'multiselect',
      },
      {
        value: EntityBluePrints.MissingTwoSelects.sharedId,
        label: EntityBluePrints.MissingTwoSelects.title,
        type: 'entity',
        inheritedValue: EntityBluePrints.MissingTwoSelects.metadata.multi_select,
        inheritedType: 'multiselect',
      },
    ],
    no_inheritance: [
      {
        value: EntityBluePrints.MissingOne.sharedId,
        label: fixtures.entities[8].title,
        type: 'entity',
      },
    ],
  },
});

export { fixtures, EntityBluePrints };
