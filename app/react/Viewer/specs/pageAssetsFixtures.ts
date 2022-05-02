import Immutable from 'immutable';
import { EntitySchema } from 'shared/types/entityType';
import { IImmutable } from 'shared/types/Immutable';
import { TemplateSchema } from 'shared/types/templateType';

const template: IImmutable<TemplateSchema> = Immutable.fromJS({
  color: '#A03AB1',
  entityViewPage: 'gr7lmh3406',
  _id: '626f4019389811b04456ab95',
  name: 'Villian',
  properties: [
    {
      _id: '626f4019389811b04456ab96',
      label: 'Character description',
      type: 'relationship',
      content: '626f3efb389811b044569513',
      relationType: '626f3fbc389811b04456a4ce',
      name: 'character_description',
      inherit: {
        property: '626f3efb389811b044569514',
        type: 'text',
      },
    },
    {
      _id: '626f40f4389811b04456bc33',
      label: 'Main enemy',
      type: 'relationship',
      content: '626f3f85389811b04456a0cd',
      relationType: '626f3f7a389811b044569db9',
      name: 'main_enemy',
    },
    {
      _id: '626f4122389811b04456c2b4',
      label: 'Main colors',
      type: 'multiselect',
      content: '626f40c7389811b04456b5b5',
      name: 'main_colors',
    },
    {
      _id: '626f4341389811b04456d3c4',
      label: 'Comic dates',
      type: 'multidaterange',
      name: 'comic_dates',
    },
  ],
  commonProperties: [
    {
      _id: '626f4019389811b04456ab97',
      label: 'Title',
      name: 'title',
      isCommonProperty: true,
      type: 'text',
      prioritySorting: false,
      generatedId: false,
    },
    {
      _id: '626f4019389811b04456ab98',
      label: 'Date added',
      name: 'creationDate',
      isCommonProperty: true,
      type: 'date',
      prioritySorting: false,
    },
    {
      _id: '626f4019389811b04456ab99',
      label: 'Date modified',
      name: 'editDate',
      isCommonProperty: true,
      type: 'date',
      prioritySorting: false,
    },
  ],
  __v: 0,
});

const entityRaw: EntitySchema = {
  sharedId: '8mdlvmt704q',
  permissions: [
    {
      refId: '58ad7d240d44252fee4e6212',
      type: 'user',
      level: 'write',
    },
  ],
  user: '58ad7d240d44252fee4e6212',
  creationDate: 1651458629899,
  published: true,
  metadata: {
    character_description: [
      {
        value: 'ci03oddudli',
        label: 'Joker',
        icon: null,
        type: 'entity',
        inheritedValue: [
          {
            value: 'Criminal mastermind',
          },
        ],
        inheritedType: 'text',
      },
    ],
    main_colors: [
      {
        value: 'ibxxz2mmc6j',
        label: 'Red',
      },
      {
        value: '50i5v4txihr',
        label: 'Blue',
      },
    ],
    main_enemy: [
      {
        value: 'v5g098ioqe',
        label: 'Batman hero',
        icon: null,
        type: 'entity',
      },
    ],
    comic_dates: [
      {
        value: {
          from: 1522627200,
          to: 1654041599,
        },
      },
      {
        value: {
          from: 1368576000,
          to: 1400111999,
        },
      },
    ],
  },
  attachments: [],
  __v: 0,
  relations: [
    {
      template: null,
      entityData: {
        sharedId: '8mdlvmt704q',
        creationDate: 1651458629899,
        published: true,
        metadata: {
          character_description: [
            {
              value: 'ci03oddudli',
              label: 'Joker',
              icon: null,
              type: 'entity',
              inheritedValue: [
                {
                  value: 'Criminal mastermind',
                },
              ],
              inheritedType: 'text',
            },
          ],
          main_colors: [
            {
              value: 'ibxxz2mmc6j',
              label: 'Red',
            },
            {
              value: '50i5v4txihr',
              label: 'Blue',
            },
          ],
          main_enemy: [
            {
              value: 'v5g098ioqe',
              label: 'Batman hero',
              icon: null,
              type: 'entity',
            },
          ],
          comic_dates: [
            {
              value: {
                from: 1522627200,
                to: 1654041599,
              },
            },
            {
              value: {
                from: 1368576000,
                to: 1400111999,
              },
            },
          ],
        },
        attachments: [],
        title: 'Joker villian',
        documents: [],
        template: '626f4019389811b04456ab95',
        _id: '626f4245389811b04456c36e',
      },
      _id: '626f4245389811b04456c37a',
      entity: '8mdlvmt704q',
      hub: '626f4245389811b04456c375',
    },
    {
      template: '626f3fbc389811b04456a4ce',
      entityData: {
        sharedId: 'ci03oddudli',
        creationDate: 1651458558816,
        published: true,
        metadata: {
          description: [
            {
              value: 'Criminal mastermind',
            },
          ],
          image: [
            {
              value: '',
            },
          ],
          number_of_comics: [
            {
              value: 35,
            },
          ],
        },
        attachments: [],
        title: 'Joker',
        documents: [],
        template: '626f3efb389811b044569513',
        _id: '626f41fe389811b04456c341',
      },
      _id: '626f4245389811b04456c37b',
      entity: 'ci03oddudli',
      hub: '626f4245389811b04456c375',
    },
    {
      template: null,
      entityData: {
        sharedId: '8mdlvmt704q',
        creationDate: 1651458629899,
        published: true,
        metadata: {
          character_description: [
            {
              value: 'ci03oddudli',
              label: 'Joker',
              icon: null,
              type: 'entity',
              inheritedValue: [
                {
                  value: 'Criminal mastermind',
                },
              ],
              inheritedType: 'text',
            },
          ],
          main_colors: [
            {
              value: 'ibxxz2mmc6j',
              label: 'Red',
            },
            {
              value: '50i5v4txihr',
              label: 'Blue',
            },
          ],
          main_enemy: [
            {
              value: 'v5g098ioqe',
              label: 'Batman hero',
              icon: null,
              type: 'entity',
            },
          ],
          comic_dates: [
            {
              value: {
                from: 1522627200,
                to: 1654041599,
              },
            },
            {
              value: {
                from: 1368576000,
                to: 1400111999,
              },
            },
          ],
        },
        attachments: [],
        title: 'Joker villian',
        documents: [],
        template: '626f4019389811b04456ab95',
        _id: '626f4245389811b04456c36e',
      },
      _id: '626f4371389811b04456d435',
      entity: '8mdlvmt704q',
      hub: '626f4371389811b04456d430',
    },
    {
      template: '626f3f7a389811b044569db9',
      entityData: {
        sharedId: 'v5g098ioqe',
        creationDate: 1651458822623,
        published: true,
        metadata: {
          character_details: [
            {
              value: 'awab9gii2uu',
              label: 'Batman',
              type: 'entity',
            },
          ],
        },
        attachments: [],
        title: 'Batman hero',
        documents: [],
        template: '626f3f85389811b04456a0cd',
        _id: '626f4306389811b04456cf38',
      },
      _id: '626f4371389811b04456d436',
      entity: 'v5g098ioqe',
      hub: '626f4371389811b04456d430',
    },
  ],
  editDate: 1651458929437,
  title: 'Joker villian',
  documents: [],
  language: 'en',
  template: '626f4019389811b04456ab95',
  _id: '626f4245389811b04456c36e',
};

const thesauri = Immutable.fromJS([
  {
    _id: '626f3f08389811b044569812',
    values: [
      {
        label: 'Flight',
        id: '4rbw98l56os',
      },
      {
        label: 'Superhuman Strength',
        id: '4e2oaqrdap1',
      },
      {
        label: 'Invisibility',
        id: 'j1augfuq7ck',
      },
    ],
    name: 'Super power',
    __v: 0,
  },
  {
    _id: '626f40c7389811b04456b5b5',
    values: [
      {
        label: 'Red',
        id: 'ibxxz2mmc6j',
      },
      {
        label: 'Blue',
        id: '50i5v4txihr',
      },
      {
        label: 'Black',
        id: '63o9gtlb5kk',
      },
    ],
    name: 'Colors',
    __v: 0,
  },
  {
    values: [
      {
        id: 'awab9gii2uu',
        label: 'Batman',
      },
      {
        id: 'ci03oddudli',
        label: 'Joker',
      },
    ],
    color: '#D9534F',
    name: 'Comic character',
    optionsCount: 2,
    properties: [
      {
        _id: '626f3efb389811b044569514',
        label: 'Description',
        type: 'text',
        name: 'description',
      },
      {
        _id: '626f3efb389811b044569515',
        label: 'Number of comics',
        type: 'numeric',
        name: 'number_of_comics',
      },
      {
        _id: '626f3efb389811b044569517',
        label: 'Image',
        type: 'image',
        name: 'image',
      },
      {
        _id: '626f42b5389811b04456caae',
        label: 'Series dates',
        type: 'multidaterange',
        name: 'series_dates',
      },
    ],
    __v: 0,
    entityViewPage: '',
    _id: '626f3efb389811b044569513',
    type: 'template',
    commonProperties: [
      {
        _id: '626f3efb389811b044569518',
        label: 'Title',
        name: 'title',
        isCommonProperty: true,
        type: 'text',
        prioritySorting: false,
        generatedId: false,
      },
      {
        _id: '626f3efb389811b044569519',
        label: 'Date added',
        name: 'creationDate',
        isCommonProperty: true,
        type: 'date',
        prioritySorting: false,
      },
      {
        _id: '626f3efb389811b04456951a',
        label: 'Date modified',
        name: 'editDate',
        isCommonProperty: true,
        type: 'date',
        prioritySorting: false,
      },
    ],
  },
  {
    values: [
      {
        id: 'v5g098ioqe',
        label: 'Batman hero',
      },
    ],
    color: '#E91E63',
    name: 'Hero',
    optionsCount: 1,
    properties: [
      {
        _id: '626f3fde389811b04456ab0c',
        label: 'Character details',
        type: 'relationship',
        content: '626f3efb389811b044569513',
        relationType: '626f3fbc389811b04456a4ce',
        name: 'character_details',
      },
    ],
    __v: 0,
    entityViewPage: '',
    _id: '626f3f85389811b04456a0cd',
    type: 'template',
    commonProperties: [
      {
        _id: '626f3f85389811b04456a0ce',
        label: 'Title',
        name: 'title',
        isCommonProperty: true,
        type: 'text',
        prioritySorting: false,
        generatedId: false,
      },
      {
        _id: '626f3f85389811b04456a0cf',
        label: 'Date added',
        name: 'creationDate',
        isCommonProperty: true,
        type: 'date',
        prioritySorting: false,
      },
      {
        _id: '626f3f85389811b04456a0d0',
        label: 'Date modified',
        name: 'editDate',
        isCommonProperty: true,
        type: 'date',
        prioritySorting: false,
      },
    ],
  },
  {
    values: [
      {
        id: '8mdlvmt704q',
        label: 'Joker villian',
      },
    ],
    color: '#A03AB1',
    name: 'Villian',
    optionsCount: 1,
    properties: [
      {
        _id: '626f4019389811b04456ab96',
        label: 'Character description',
        type: 'relationship',
        content: '626f3efb389811b044569513',
        relationType: '626f3fbc389811b04456a4ce',
        name: 'character_description',
        inherit: {
          property: '626f3efb389811b044569514',
          type: 'text',
        },
      },
      {
        _id: '626f40f4389811b04456bc33',
        label: 'Main enemy',
        type: 'relationship',
        content: '626f3f85389811b04456a0cd',
        relationType: '626f3f7a389811b044569db9',
        name: 'main_enemy',
      },
      {
        _id: '626f4122389811b04456c2b4',
        label: 'Main colors',
        type: 'multiselect',
        content: '626f40c7389811b04456b5b5',
        name: 'main_colors',
      },
      {
        _id: '626f4341389811b04456d3c4',
        label: 'Comic dates',
        type: 'multidaterange',
        name: 'comic_dates',
      },
    ],
    __v: 0,
    entityViewPage: 'gr7lmh3406',
    _id: '626f4019389811b04456ab95',
    type: 'template',
    commonProperties: [
      {
        _id: '626f4019389811b04456ab97',
        label: 'Title',
        name: 'title',
        isCommonProperty: true,
        type: 'text',
        prioritySorting: false,
        generatedId: false,
      },
      {
        _id: '626f4019389811b04456ab98',
        label: 'Date added',
        name: 'creationDate',
        isCommonProperty: true,
        type: 'date',
        prioritySorting: false,
      },
      {
        _id: '626f4019389811b04456ab99',
        label: 'Date modified',
        name: 'editDate',
        isCommonProperty: true,
        type: 'date',
        prioritySorting: false,
      },
    ],
  },
]);

export { template, entityRaw, thesauri };
