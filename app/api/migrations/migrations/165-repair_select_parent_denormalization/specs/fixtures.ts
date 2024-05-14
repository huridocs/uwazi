import { ObjectId } from 'mongodb';
import { Fixture, Metadata, TestedLanguages, Translation } from '../types';

const ids: { [key: string]: ObjectId } = {
  dict: new ObjectId(),
  dict2: new ObjectId(),
  selectProp: new ObjectId(),
  select2Prop: new ObjectId(),
  multiselectProp: new ObjectId(),
  textProp: new ObjectId(),
  reltype: new ObjectId(),
  unrelatedTemplate: new ObjectId(),
  selectsTemplate: new ObjectId(),
  inheritedSelectsTemplate: new ObjectId(),
};

const templateWithSelects = {
  _id: ids.selectsTemplate,
  name: 'with_selects',
  properties: [
    {
      _id: ids.selectProp,
      content: ids.dict.toString(),
      label: 'Select',
      type: 'select' as 'select',
      name: 'select',
    },
    {
      _id: ids.multiselectProp,
      content: ids.dict.toString(),
      label: 'Multiselect',
      type: 'multiselect' as 'multiselect',
      name: 'multiselect',
    },
    {
      _id: ids.textProp,
      label: 'text',
      type: 'text' as 'text',
      name: 'text',
    },
    {
      _id: ids.select2Prop,
      content: ids.dict2.toString(),
      label: 'Select2',
      type: 'select' as 'select',
      name: 'select2',
    },
  ],
};

const templateWithInheritance = {
  _id: ids.inheritedSelectsTemplate,
  name: 'with_inherited_selects',
  properties: [
    {
      _id: new ObjectId(),
      content: ids.dict.toString(),
      label: 'inherited_select',
      type: 'relationship' as 'relationship',
      inherit: {
        property: ids.selectProp.toString(),
        type: 'select' as 'select',
      },
      relationType: ids.reltype.toString(),
      name: 'inherited_select',
    },
    {
      _id: new ObjectId(),
      content: ids.dict.toString(),
      label: 'inherited_multiselect',
      type: 'relationship' as 'relationship',
      inherit: {
        property: ids.multiselectProp.toString(),
        type: 'multiselect' as 'multiselect',
      },
      relationType: ids.reltype.toString(),
      name: 'inherited_multiselect',
    },
    {
      _id: new ObjectId(),
      content: ids.dict.toString(),
      label: 'inherited_text',
      type: 'relationship' as 'relationship',
      inherit: {
        property: ids.textProp.toString(),
        type: 'text' as 'text',
      },
      relationType: ids.reltype.toString(),
      name: 'inherited_text',
    },
    {
      _id: new ObjectId(),
      content: ids.dict2.toString(),
      label: 'inherited_select2',
      type: 'relationship' as 'relationship',
      inherit: {
        property: ids.select2Prop.toString(),
        type: 'select' as 'select',
      },
      relationType: ids.reltype.toString(),
      name: 'inherited_select2',
    },
  ],
};

const incorrectMetadata: Metadata = {
  select: [
    {
      value: 'B1_id',
      label: 'B1',
    },
  ],
  multiselect: [
    {
      value: 'A2_id',
      label: 'A2',
    },
    {
      value: 'B3_id',
      label: 'B3',
      // @ts-ignore - intentional missing value
      parent: {},
    },
    {
      value: 'A3_id',
      label: 'A3',
      parent: {
        value: 'C_id',
        label: 'C',
      },
    },
  ],
  select2: [
    {
      value: 'child_id',
      label: 'child',
    },
  ],
};

const baseEntities = {
  correct1: {
    title: 'entity_with_correct_selects',
    language: 'en',
    sharedId: 'entity_with_correct_selects',
    template: ids.selectsTemplate,
    metadata: {
      select: [
        {
          value: '1_id',
          label: '1',
        },
      ],
      multiselect: [
        {
          value: '2_id',
          label: '2',
        },
        {
          value: 'A1_id',
          label: 'A1',
          parent: {
            value: 'A_id',
            label: 'A',
          },
        },
      ],
      text: [
        {
          value: 'some_text',
          label: 'some_text',
        },
      ],
    },
  },
  correct2: {
    title: 'entity_with_correct_selects2',
    language: 'en',
    sharedId: 'entity_with_correct_selects2',
    template: ids.selectsTemplate,
    metadata: {
      select: [
        {
          value: '2_id',
          label: '2',
        },
      ],
      multiselect: [
        {
          value: '3_id',
          label: '3',
        },
        {
          value: 'B2_id',
          label: 'B2',
          parent: {
            value: 'B_id',
            label: 'B',
          },
        },
      ],
      text: [
        {
          value: 'some_text',
          label: 'some_text',
        },
      ],
    },
  },
  incorrect: {
    title: 'entity_with_incorrect_selects',
    language: 'en',
    sharedId: 'entity_with_incorrect_selects',
    template: ids.selectsTemplate,
    metadata: incorrectMetadata,
  },
  incorrect2: {
    title: 'entity_with_incorrect_selects2',
    language: 'en',
    sharedId: 'entity_with_incorrect_selects2',
    template: ids.selectsTemplate,
    metadata: incorrectMetadata,
  },
  multiLanguageSelects: {
    title: 'multi_language_entity_with_selects',
    language: 'en',
    sharedId: 'multi_language_entity_with_selects',
    template: ids.selectsTemplate,
    metadata: incorrectMetadata,
  },
  multiLanguageInherits: {
    title: 'multi_language_entity_with_inherited_selects',
    language: 'en',
    sharedId: 'multi_language_entity_with_inherited_selects',
    template: ids.inheritedSelectsTemplate,
    metadata: {
      inherited_select: [
        {
          value: 'multi_language_entity_with_selects',
          label: 'multi_language_entity_with_selects',
          inheritedType: 'select',
          inheritedValue: incorrectMetadata.select,
        },
      ],
      inherited_multiselect: [
        {
          value: 'multi_language_entity_with_selects',
          label: 'multi_language_entity_with_selects',
          inheritedType: 'multiselect',
          inheritedValue: incorrectMetadata.multiselect,
        },
      ],
      inherited_select2: [
        {
          value: 'multi_language_entity_with_selects',
          label: 'multi_language_entity_with_selects',
          inheritedType: 'select',
          inheritedValue: incorrectMetadata.select2,
        },
      ],
    },
  },
};

const entities = {
  ...baseEntities,
  correctInheritance: {
    title: 'entity_with_correct_inherited_selects',
    language: 'en',
    sharedId: 'entity_with_correct_inherited_selects',
    template: ids.inheritedSelectsTemplate,
    metadata: {
      inherited_select: [
        {
          value: baseEntities.correct1.sharedId,
          label: baseEntities.correct1.title,
          inheritedType: 'select',
          inheritedValue: baseEntities.correct1.metadata.select,
        },
        {
          value: baseEntities.correct2.sharedId,
          label: baseEntities.correct2.title,
          inheritedType: 'select',
          inheritedValue: baseEntities.correct2.metadata.select,
        },
      ],
      inherited_multiselect: [
        {
          value: baseEntities.correct1.sharedId,
          label: baseEntities.correct1.title,
          inheritedType: 'multiselect',
          inheritedValue: baseEntities.correct1.metadata.multiselect,
        },
        {
          value: baseEntities.correct2.sharedId,
          label: baseEntities.correct2.title,
          inheritedType: 'multiselect',
          inheritedValue: baseEntities.correct2.metadata.multiselect,
        },
      ],
    },
  },
};

const relationtypes = [
  {
    _id: ids.reltype,
    name: 'relationtype',
  },
];

const oneLanguageFixtures: Fixture = {
  dictionaries: [
    {
      _id: ids.dict,
      name: 'dict',
      values: [
        {
          label: '1',
          id: '1_id',
        },
        {
          label: '2',
          id: '2_id',
        },
        {
          label: '3',
          id: '3_id',
        },
        {
          label: 'A',
          id: 'A_id',
          values: [
            {
              label: 'A1',
              id: 'A1_id',
            },
            {
              label: 'A2',
              id: 'A2_id',
            },
            {
              label: 'A3',
              id: 'A3_id',
            },
          ],
        },
        {
          label: 'B',
          id: 'B_id',
          values: [
            {
              label: 'B1',
              id: 'B1_id',
            },
            {
              label: 'B2',
              id: 'B2_id',
            },
            {
              label: 'B3',
              id: 'B3_id',
            },
          ],
        },
        {
          label: 'C',
          id: 'C_id',
          values: [],
        },
      ],
    },
    {
      _id: ids.dict2,
      name: 'dict2',
      values: [
        {
          label: 'root',
          id: 'root_id',
        },
        {
          label: 'group',
          id: 'group_id',
          values: [
            {
              label: 'child',
              id: 'child_id',
            },
          ],
        },
      ],
    },
  ],
  relationtypes,
  templates: [
    {
      _id: ids.unrelatedTemplate,
      name: 'unrelated_template',
      properties: [
        {
          label: 'text',
          type: 'text',
          name: 'text',
        },
      ],
    },
    templateWithSelects,
    templateWithInheritance,
  ],
  entities: [
    {
      title: 'unrelated_entity',
      language: 'en',
      sharedId: 'unrelated_entity',
      template: ids.unrelatedTemplate,
      metadata: {
        text: [
          {
            value: 'some_text',
            label: 'some_text',
          },
        ],
      },
    },
    entities.correct1,
    entities.correct2,
    entities.correctInheritance,
    entities.incorrect,
    entities.incorrect2,
    {
      title: 'entity_with_incorrect_inherited_selects',
      language: 'en',
      sharedId: 'entity_with_incorrect_inherited_selects',
      template: ids.inheritedSelectsTemplate,
      metadata: {
        inherited_select: [
          {
            value: entities.incorrect.sharedId,
            label: entities.incorrect.title,
            inheritedType: 'select',
            inheritedValue: entities.incorrect.metadata.select,
          },
          {
            value: entities.incorrect2.sharedId,
            label: entities.incorrect2.title,
            inheritedType: 'select',
            inheritedValue: entities.incorrect2.metadata.select,
          },
        ],
        inherited_multiselect: [
          {
            value: entities.incorrect.sharedId,
            label: entities.incorrect.title,
            inheritedType: 'multiselect',
            inheritedValue: entities.incorrect.metadata.multiselect,
          },
        ],
        inherited_select2: [
          {
            value: entities.incorrect.sharedId,
            label: entities.incorrect.title,
            inheritedType: 'select',
            inheritedValue: entities.incorrect.metadata.select2,
          },
        ],
      },
    },
  ],
};

const dictContext = {
  type: 'Thesaurus' as 'Thesaurus',
  label: 'dict',
  id: ids.dict.toString(),
};

const dict2Context = {
  type: 'Thesaurus' as 'Thesaurus',
  label: 'dict2',
  id: ids.dict2.toString(),
};

const createTranslations = (
  key: string,
  languages: TestedLanguages[],
  context: Translation['context']
) =>
  languages.map(language => {
    const suffix = language === 'en' ? '' : `_${language}`;
    return {
      _id: new ObjectId(),
      language,
      key,
      value: `${key}${suffix}`,
      context,
    };
  });

const languages: TestedLanguages[] = ['en', 'es', 'pt'];

const multiLanguageFixtures: Fixture = {
  dictionaries: oneLanguageFixtures.dictionaries,
  translationsV2: [
    ...createTranslations('1', languages, dictContext),
    ...createTranslations('2', languages, dictContext),
    ...createTranslations('3', languages, dictContext),
    ...createTranslations('A', languages, dictContext),
    ...createTranslations('B', languages, dictContext),
    ...createTranslations('C', languages, dictContext),
    ...createTranslations('A1', languages, dictContext),
    ...createTranslations('A2', languages, dictContext),
    ...createTranslations('A3', languages, dictContext),
    ...createTranslations('B1', languages, dictContext),
    ...createTranslations('B2', languages, dictContext),
    ...createTranslations('B3', languages, dictContext),
    ...createTranslations('root', languages, dict2Context),
    ...createTranslations('group', languages, dict2Context),
    ...createTranslations('child', languages, dict2Context),
  ],
  relationtypes,
  templates: [templateWithSelects, templateWithInheritance],
  entities: [
    entities.multiLanguageSelects,
    {
      ...entities.multiLanguageSelects,
      language: 'es',
    },
    {
      ...entities.multiLanguageSelects,
      language: 'pt',
    },
    entities.multiLanguageInherits,
    {
      ...entities.multiLanguageInherits,
      language: 'es',
    },
    {
      ...entities.multiLanguageInherits,
      language: 'pt',
    },
  ],
};

const correctFixtures = {
  dictionaries: oneLanguageFixtures.dictionaries,
  relationtypes: oneLanguageFixtures.relationtypes,
  templates: oneLanguageFixtures.templates,
  entities: [...(oneLanguageFixtures.entities?.slice(0, 4) || [])],
};

export { entities, oneLanguageFixtures, multiLanguageFixtures, correctFixtures };
