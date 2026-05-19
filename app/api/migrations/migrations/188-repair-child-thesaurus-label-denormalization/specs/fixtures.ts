import { ObjectId } from 'mongodb';
import { DBFixture } from '#api/utils/testing_db.js';

type TranslationFixture = NonNullable<DBFixture['translationsV2']>[number];
type DictionaryFixture = NonNullable<DBFixture['dictionaries']>[number];

const ids = {
  hierarchicalDict: new ObjectId(),
  flatDict: new ObjectId(),
  directTemplate: new ObjectId(),
  inheritedTemplate: new ObjectId(),
  unusedTemplate: new ObjectId(),
  statusProp: new ObjectId(),
  inheritedStatusProp: new ObjectId(),
  relationshipType: new ObjectId(),
};

const makeTranslation = (
  contextId: string,
  language: 'en' | 'es',
  key: string,
  value: string
): TranslationFixture => ({
  _id: new ObjectId(),
  context: { id: contextId, label: 'status', type: 'Thesaurus' },
  language,
  key,
  value,
});

const baseSettings: DBFixture['settings'] = [
  {
    _id: new ObjectId(),
    languages: [
      { key: 'en', label: 'English', default: true },
      { key: 'es', label: 'Spanish' },
    ],
  },
];

const noLanguagesSettings: DBFixture['settings'] = [
  {
    _id: new ObjectId(),
    languages: [],
  },
];

const noDefaultLanguageSettings: DBFixture['settings'] = [
  {
    _id: new ObjectId(),
    languages: [
      { key: 'en', label: 'English' },
      { key: 'es', label: 'Spanish' },
    ],
  },
];

const hierarchicalDictionary: DictionaryFixture = {
  _id: ids.hierarchicalDict,
  name: 'status',
  values: [
    {
      id: 'in_court',
      label: 'in court',
      values: [
        { id: 'yes_in_court', label: 'yes' },
        { id: 'no_in_court', label: 'no' },
        { id: 'maybe_in_court', label: 'maybe' },
      ],
    },
    {
      id: 'in_government',
      label: 'in government',
      values: [
        { id: 'yes_in_government', label: 'yes' },
        { id: 'no_in_government', label: 'no' },
      ],
    },
  ],
};

const flatDictionary: DictionaryFixture = {
  _id: ids.flatDict,
  name: 'flat_status',
  values: [
    { id: 'flat_yes', label: 'yes' },
    { id: 'flat_no', label: 'no' },
  ],
};

const templates: DBFixture['templates'] = [
  {
    _id: ids.directTemplate,
    name: 'direct',
    properties: [
      {
        _id: ids.statusProp,
        name: 'status',
        label: 'Status',
        type: 'select',
        content: ids.hierarchicalDict.toString(),
      },
      {
        _id: new ObjectId(),
        name: 'flat_status',
        label: 'Flat status',
        type: 'select',
        content: ids.flatDict.toString(),
      },
      {
        _id: new ObjectId(),
        name: 'status_multi',
        label: 'Status multi',
        type: 'multiselect',
        content: ids.hierarchicalDict.toString(),
      },
    ],
  },
  {
    _id: ids.inheritedTemplate,
    name: 'inherited',
    properties: [
      {
        _id: ids.inheritedStatusProp,
        name: 'inherited_status',
        label: 'Inherited status',
        type: 'relationship',
        relationType: ids.relationshipType.toString(),
        inherit: {
          property: ids.statusProp.toString(),
          type: 'select',
        },
      },
    ],
  },
  {
    _id: ids.unusedTemplate,
    name: 'unused',
    properties: [{ _id: new ObjectId(), name: 'title', label: 'Title', type: 'text' }],
  },
];

const translationsV2: DBFixture['translationsV2'] = [
  makeTranslation(ids.hierarchicalDict.toString(), 'en', 'yes', 'yes'),
  makeTranslation(ids.hierarchicalDict.toString(), 'en', 'no', 'no'),
  makeTranslation(ids.hierarchicalDict.toString(), 'en', 'in court', 'in court'),
  makeTranslation(ids.hierarchicalDict.toString(), 'en', 'in government', 'in government'),
  makeTranslation(ids.hierarchicalDict.toString(), 'es', 'yes', 'si'),
  makeTranslation(ids.hierarchicalDict.toString(), 'es', 'no', 'no'),
  makeTranslation(ids.hierarchicalDict.toString(), 'es', 'in court', 'en corte'),
  makeTranslation(ids.hierarchicalDict.toString(), 'es', 'in government', 'en gobierno'),
];

const entitiesNeedingRepair: DBFixture['entities'] = [
  {
    _id: new ObjectId(),
    title: 'direct_en',
    sharedId: 'direct_shared',
    language: 'en',
    template: ids.directTemplate,
    metadata: {
      status: [
        {
          value: 'yes_in_court',
          label: 'old_yes',
          parent: { value: 'wrong_parent', label: 'old_parent' },
        },
      ],
      status_multi: [
        {
          value: 'yes_in_court',
          label: 'wrong_yes_1',
          parent: { value: 'wrong_parent', label: 'wrong_parent_1' },
        },
        {
          value: 'yes_in_government',
          label: 'wrong_yes_2',
          parent: { value: 'wrong_parent', label: 'wrong_parent_2' },
        },
      ],
      flat_status: [{ value: 'flat_yes', label: 'flat_old_yes' }],
    },
  },
  {
    _id: new ObjectId(),
    title: 'direct_es',
    sharedId: 'direct_shared',
    language: 'es',
    template: ids.directTemplate,
    metadata: {
      status: [
        {
          value: 'yes_in_government',
          label: 'old_yes_es',
          parent: { value: 'wrong_parent', label: 'old_parent_es' },
        },
      ],
      status_multi: [
        {
          value: 'maybe_in_court',
          label: 'old_maybe_es',
          parent: { value: 'wrong_parent', label: 'wrong_parent_es' },
        },
      ],
    },
  },
  {
    _id: new ObjectId(),
    title: 'missing_language_uses_default',
    sharedId: 'missing_language_uses_default_shared',
    template: ids.directTemplate,
    metadata: {
      status: [
        {
          value: 'no_in_court',
          label: 'old_no',
          parent: { value: 'wrong_parent', label: 'old_parent' },
        },
      ],
    },
  },
  {
    _id: new ObjectId(),
    title: 'inherited_en',
    sharedId: 'inherited_shared',
    language: 'en',
    template: ids.inheritedTemplate,
    metadata: {
      inherited_status: [
        {
          value: 'direct_shared',
          label: 'direct_en',
          inheritedType: 'select',
          inheritedValue: [
            {
              value: 'no_in_government',
              label: 'old_no',
              parent: { value: 'wrong_parent', label: 'old_parent' },
            },
          ],
        },
      ],
    },
  },
  {
    _id: new ObjectId(),
    title: 'already_correct',
    sharedId: 'already_correct_shared',
    language: 'en',
    template: ids.directTemplate,
    metadata: {
      status: [
        { value: 'no_in_court', label: 'no', parent: { value: 'in_court', label: 'in court' } },
      ],
      status_multi: [
        {
          value: 'yes_in_government',
          label: 'yes',
          parent: { value: 'in_government', label: 'in government' },
        },
      ],
    },
  },
  {
    _id: new ObjectId(),
    title: 'unknown_value_kept',
    sharedId: 'unknown_value_shared',
    language: 'en',
    template: ids.directTemplate,
    metadata: {
      status: [{ value: 'unknown_value_id', label: 'custom label' }],
    },
  },
  {
    _id: new ObjectId(),
    title: 'inherited_non_array_kept',
    sharedId: 'inherited_non_array_shared',
    language: 'en',
    template: ids.inheritedTemplate,
    metadata: {
      inherited_status: [
        {
          value: 'direct_shared',
          label: 'direct_en',
          inheritedType: 'select',
          // @ts-ignore intentional malformed shape
          inheritedValue: 'not_an_array',
        },
      ],
    },
  },
  {
    _id: new ObjectId(),
    title: 'without_metadata',
    sharedId: 'without_metadata_shared',
    language: 'en',
    template: ids.directTemplate,
  },
  {
    _id: new ObjectId(),
    title: 'unrelated',
    sharedId: 'unrelated_shared',
    language: 'en',
    template: ids.unusedTemplate,
    metadata: {
      title: [{ value: 'leave me as is' }],
    },
  },
];

const noChildrenFixtures: DBFixture = {
  settings: baseSettings,
  dictionaries: [flatDictionary],
  templates: [
    {
      _id: ids.directTemplate,
      name: 'flat_only',
      properties: [
        {
          _id: ids.statusProp,
          name: 'status',
          label: 'Status',
          type: 'select',
          content: ids.flatDict.toString(),
        },
      ],
    },
  ],
  entities: [
    {
      _id: new ObjectId(),
      title: 'flat_entity',
      sharedId: 'flat_entity_shared',
      language: 'en',
      template: ids.directTemplate,
      metadata: {
        status: [{ value: 'flat_yes', label: 'flat_yes' }],
      },
    },
  ],
};

const childrenButUnusedFixtures: DBFixture = {
  settings: baseSettings,
  dictionaries: [hierarchicalDictionary],
  templates: [
    {
      _id: ids.unusedTemplate,
      name: 'unused',
      properties: [{ _id: new ObjectId(), name: 'title', label: 'Title', type: 'text' }],
    },
  ],
  entities: [
    {
      _id: new ObjectId(),
      title: 'unused_entity',
      sharedId: 'unused_entity_shared',
      language: 'en',
      template: ids.unusedTemplate,
      metadata: {
        title: [{ value: 'no change expected' }],
      },
    },
  ],
};

const repairFixtures: DBFixture = {
  settings: baseSettings,
  dictionaries: [hierarchicalDictionary, flatDictionary],
  templates,
  relationtypes: [{ _id: ids.relationshipType, name: 'related' }],
  translationsV2,
  entities: entitiesNeedingRepair,
};

const allAlreadyDenormalizedFixtures: DBFixture = {
  settings: baseSettings,
  dictionaries: [hierarchicalDictionary, flatDictionary],
  templates,
  relationtypes: [{ _id: ids.relationshipType, name: 'related' }],
  translationsV2,
  entities: [
    {
      _id: new ObjectId(),
      title: 'direct_en',
      sharedId: 'direct_shared',
      language: 'en',
      template: ids.directTemplate,
      metadata: {
        status: [
          { value: 'yes_in_court', label: 'yes', parent: { value: 'in_court', label: 'in court' } },
        ],
        status_multi: [
          {
            value: 'yes_in_court',
            label: 'yes',
            parent: { value: 'in_court', label: 'in court' },
          },
          {
            value: 'yes_in_government',
            label: 'yes',
            parent: { value: 'in_government', label: 'in government' },
          },
        ],
        flat_status: [{ value: 'flat_yes', label: 'flat_old_yes' }],
      },
    },
    {
      _id: new ObjectId(),
      title: 'direct_es',
      sharedId: 'direct_shared',
      language: 'es',
      template: ids.directTemplate,
      metadata: {
        status: [
          {
            value: 'yes_in_government',
            label: 'si',
            parent: { value: 'in_government', label: 'en gobierno' },
          },
        ],
        status_multi: [
          {
            value: 'maybe_in_court',
            label: 'maybe',
            parent: { value: 'in_court', label: 'en corte' },
          },
        ],
      },
    },
    {
      _id: new ObjectId(),
      title: 'inherited_en',
      sharedId: 'inherited_shared',
      language: 'en',
      template: ids.inheritedTemplate,
      metadata: {
        inherited_status: [
          {
            value: 'direct_shared',
            label: 'direct_en',
            inheritedType: 'select',
            inheritedValue: [
              {
                value: 'no_in_government',
                label: 'no',
                parent: { value: 'in_government', label: 'in government' },
              },
            ],
          },
        ],
      },
    },
    {
      _id: new ObjectId(),
      title: 'already_correct',
      sharedId: 'already_correct_shared',
      language: 'en',
      template: ids.directTemplate,
      metadata: {
        status: [
          { value: 'no_in_court', label: 'no', parent: { value: 'in_court', label: 'in court' } },
        ],
        status_multi: [
          {
            value: 'yes_in_government',
            label: 'yes',
            parent: { value: 'in_government', label: 'in government' },
          },
        ],
      },
    },
    {
      _id: new ObjectId(),
      title: 'unknown_value_kept',
      sharedId: 'unknown_value_shared',
      language: 'en',
      template: ids.directTemplate,
      metadata: {
        status: [{ value: 'unknown_value_id', label: 'custom label' }],
      },
    },
    {
      _id: new ObjectId(),
      title: 'inherited_non_array_kept',
      sharedId: 'inherited_non_array_shared',
      language: 'en',
      template: ids.inheritedTemplate,
      metadata: {
        inherited_status: [
          {
            value: 'direct_shared',
            label: 'direct_en',
            inheritedType: 'select',
            // @ts-ignore intentional malformed shape
            inheritedValue: 'not_an_array',
          },
        ],
      },
    },
    {
      _id: new ObjectId(),
      title: 'without_metadata',
      sharedId: 'without_metadata_shared',
      language: 'en',
      template: ids.directTemplate,
    },
    {
      _id: new ObjectId(),
      title: 'unrelated',
      sharedId: 'unrelated_shared',
      language: 'en',
      template: ids.unusedTemplate,
      metadata: {
        title: [{ value: 'leave me as is' }],
      },
    },
  ],
};

const noTemplatesFixtures: DBFixture = {
  settings: baseSettings,
  dictionaries: [hierarchicalDictionary],
  templates: [],
  entities: [
    {
      _id: new ObjectId(),
      title: 'entity_without_templates',
      sharedId: 'entity_without_templates_shared',
      language: 'en',
      template: ids.directTemplate,
      metadata: {
        status: [{ value: 'yes_in_court', label: 'old_yes' }],
      },
    },
  ],
};

const noEntitiesFixtures: DBFixture = {
  settings: baseSettings,
  dictionaries: [hierarchicalDictionary],
  templates,
  entities: [],
};

const noLanguagesInSettingsFixtures: DBFixture = {
  settings: noLanguagesSettings,
  dictionaries: [hierarchicalDictionary, flatDictionary],
  templates,
  relationtypes: [{ _id: ids.relationshipType, name: 'related' }],
  translationsV2,
  entities: entitiesNeedingRepair,
};

const noDefaultLanguageInSettingsFixtures: DBFixture = {
  settings: noDefaultLanguageSettings,
  dictionaries: [hierarchicalDictionary, flatDictionary],
  templates,
  relationtypes: [{ _id: ids.relationshipType, name: 'related' }],
  translationsV2,
  entities: entitiesNeedingRepair,
};

const noDefaultAndMissingLanguageFixtures: DBFixture = {
  settings: noDefaultLanguageSettings,
  dictionaries: [hierarchicalDictionary],
  templates: [
    {
      _id: ids.directTemplate,
      name: 'direct',
      properties: [
        {
          _id: ids.statusProp,
          name: 'status',
          label: 'Status',
          type: 'select',
          content: ids.hierarchicalDict.toString(),
        },
      ],
    },
  ],
  entities: [
    {
      _id: new ObjectId(),
      title: 'missing_language_skipped_without_default',
      sharedId: 'missing_language_skipped_without_default_shared',
      template: ids.directTemplate,
      metadata: {
        status: [
          {
            value: 'yes_in_court',
            label: 'old_yes',
            parent: { value: 'wrong_parent', label: 'wrong_parent' },
          },
        ],
      },
    },
  ],
};

export {
  noChildrenFixtures,
  childrenButUnusedFixtures,
  repairFixtures,
  noTemplatesFixtures,
  noEntitiesFixtures,
  noLanguagesInSettingsFixtures,
  noDefaultLanguageInSettingsFixtures,
  noDefaultAndMissingLanguageFixtures,
  allAlreadyDenormalizedFixtures,
};
