import { ObjectId } from 'mongodb';
import { Fixture, Metadata } from '../types';

const ids: { [key: string]: ObjectId } = {
  dict: new ObjectId(),
  selectProp: new ObjectId(),
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
  ],
};

const templateWithInheritance = {
  _id: ids.inheritedSelectsTemplate,
  name: 'with_inherited_selects',
  properties: [
    {
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
};

const entities = {
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
    {
      title: 'entity_with_correct_inherited_selects',
      language: 'en',
      sharedId: 'entity_with_correct_inherited_selects',
      template: ids.inheritedSelectsTemplate,
      metadata: {
        inherited_select: [
          {
            value: entities.correct1.sharedId,
            label: entities.correct1.title,
            inheritedType: 'select',
            inheritedValue: entities.correct1.metadata.select,
          },
          {
            value: entities.correct2.sharedId,
            label: entities.correct2.title,
            inheritedType: 'select',
            inheritedValue: entities.correct2.metadata.select,
          },
        ],
        inherited_multiselect: [
          {
            value: entities.correct1.sharedId,
            label: entities.correct1.title,
            inheritedType: 'multiselect',
            inheritedValue: entities.correct1.metadata.multiselect,
          },
          {
            value: entities.correct2.sharedId,
            label: entities.correct2.title,
            inheritedType: 'multiselect',
            inheritedValue: entities.correct2.metadata.multiselect,
          },
        ],
      },
    },
    entities.incorrect,
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
        ],
        inherited_multiselect: [
          {
            value: entities.incorrect.sharedId,
            label: entities.incorrect.title,
            inheritedType: 'multiselect',
            inheritedValue: entities.incorrect.metadata.multiselect,
          },
        ],
      },
    },
  ],
};

const multiLanguageDictionaryContext = {
  type: 'Thesaurus' as 'Thesaurus',
  label: 'dict',
  id: ids.dict.toString(),
};

const multiLanguageFixtures: Fixture = {
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
          label: 'A',
          id: 'A_id',
          values: [
            {
              label: 'A1',
              id: 'A1_id',
            },
          ],
        },
      ],
    },
  ],
  translationsV2: [
    {
      language: 'en',
      key: '1',
      value: '1',
      context: multiLanguageDictionaryContext,
    },
    {
      language: 'en',
      key: 'A',
      value: 'A',
      context: multiLanguageDictionaryContext,
    },
    {
      language: 'en',
      key: 'A1',
      value: 'A1',
      context: multiLanguageDictionaryContext,
    },
    {
      language: 'es',
      key: '1',
      value: '1_es',
      context: multiLanguageDictionaryContext,
    },
    {
      language: 'es',
      key: 'A',
      value: 'A_es',
      context: multiLanguageDictionaryContext,
    },
    {
      language: 'es',
      key: 'A1',
      value: 'A1_es',
      context: multiLanguageDictionaryContext,
    },
    {
      language: 'pt',
      key: '1',
      value: '1_pt',
      context: multiLanguageDictionaryContext,
    },
    {
      language: 'pt',
      key: 'A',
      value: 'A_pt',
      context: multiLanguageDictionaryContext,
    },
    {
      language: 'pt',
      key: 'A1',
      value: 'A1_pt',
      context: multiLanguageDictionaryContext,
    },
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

export { oneLanguageFixtures, multiLanguageFixtures };
