/* eslint-disable max-lines */
import Immutable from 'immutable';
import { EntitySchema } from 'shared/types/entityType';
import { IImmutable } from 'shared/types/Immutable';
import { TemplateSchema } from 'shared/types/templateType';

const dbTemplate: IImmutable<TemplateSchema> = Immutable.fromJS({
  _id: '5bfbb1a0471dd0fc16ada146',
  name: 'Document',
  commonProperties: [
    {
      _id: '5bfbb1a0471dd0fc16ada148',
      label: 'Title',
      name: 'title',
      isCommonProperty: true,
      type: 'text',
      prioritySorting: false,
    },
    {
      _id: '5bfbb1a0471dd0fc16ada147',
      label: 'Date added',
      name: 'creationDate',
      isCommonProperty: true,
      type: 'date',
      prioritySorting: false,
    },
  ],
  properties: [
    { _id: '6267e68226904c252518f914', label: 'Text', type: 'text', name: 'text', filter: true },
    {
      _id: '6267e68226904c252518f915',
      label: 'Numeric',
      type: 'numeric',
      name: 'numeric',
      filter: true,
    },
    {
      _id: '62693f2b3483cd0da78b6ffb',
      label: 'Select',
      type: 'select',
      content: '626825379c8a75a1ea9a821e',
      name: 'select',
      filter: true,
    },
    {
      _id: '627176d9ff128cfd6de09972',
      label: 'Multi Select',
      type: 'multiselect',
      content: '626825379c8a75a1ea9a821e',
      name: 'multi_select',
    },
    {
      _id: '626c191b8a46c11701b499b3',
      label: 'Relationship',
      type: 'relationship',
      content: '626c19238a46c11701b49a55',
      relationType: '626c19088a46c11701b493e6',
      name: 'relationship',
    },
    {
      _id: '626c19418a46c11701b4a390',
      label: 'Inherit',
      type: 'relationship',
      content: '626c19238a46c11701b49a55',
      relationType: '626c19088a46c11701b493e6',
      name: 'inherit',
      inherit: { property: '626c19498a46c11701b4a702', type: 'date' },
    },
    { _id: '627176d9ff128cfd6de09975', label: 'Date', type: 'date', name: 'date' },
    {
      _id: '627176d9ff128cfd6de09976',
      label: 'Date Range',
      type: 'daterange',
      name: 'date_range',
    },
    {
      _id: '627176d9ff128cfd6de09977',
      label: 'Multi Date',
      type: 'multidate',
      name: 'multi_date',
    },
    {
      _id: '627176d9ff128cfd6de09978',
      label: 'Multi Date Range',
      type: 'multidaterange',
      name: 'multi_date_range',
    },
    { _id: '627176d9ff128cfd6de09979', label: 'Rich Text', type: 'markdown', name: 'rich_text' },
    { _id: '627176d9ff128cfd6de0997a', label: 'Link', type: 'link', name: 'link' },
    { _id: '627176d9ff128cfd6de0997b', label: 'Image', type: 'image', name: 'image' },
    { _id: '627176d9ff128cfd6de0997c', label: 'Media', type: 'media', name: 'media' },
    {
      _id: '627176d9ff128cfd6de0997d',
      label: 'Geolocation',
      type: 'geolocation',
      name: 'geolocation_geolocation',
    },
  ],
  __v: 0,
  default: true,
  color: '#e46841',
  entityViewPage: '8x8b1bzsj1i',
});

const dbEntity: EntitySchema = {
  sharedId: 'mtpkxxe1uom',
  permissions: [
    {
      refId: '58ada34d299e82674854510f',
      type: 'user',
      level: 'write',
    },
  ],
  user: '58ada34d299e82674854510f',
  creationDate: 1650976400574,
  published: true,
  metadata: {
    multi_select: [
      {
        value: 'k9vqx1bkkso',
        label: 'Colombia',
      },
      {
        value: 'f5t0ah6aluq',
        label: 'Argentina',
      },
    ],
    media: [
      {
        value: '/api/files/1651603234992ndu8pskupzp.mp4',
      },
    ],
    date_range: [
      {
        value: {
          from: 1651536000,
          to: 1651708799,
        },
      },
    ],
    text: [
      {
        value: 'one',
      },
    ],
    geolocation_geolocation: [
      {
        value: {
          lat: 46.660244945286394,
          lon: 8.283691406250002,
          label: '',
        },
      },
    ],
    numeric: [
      {
        value: 1,
      },
    ],
    date: [
      {
        value: 1651536000,
      },
    ],
    rich_text: [
      {
        value: 'Test 1 long text',
      },
    ],
    multi_date_range: [
      {
        value: {
          from: 1651968000,
          to: 1652486399,
        },
      },
      {
        value: {
          from: 1652572800,
          to: 1653091199,
        },
      },
    ],
    multi_date: [
      {
        value: 1651622400,
      },
      {
        value: 1651708800,
      },
    ],
    relationship: [
      {
        value: 'zse9gkdu27',
        label: 'Test 5',
        icon: null,
        type: 'entity',
      },
    ],
    link: [
      {
        value: {
          label: 'test',
          url: 'https://google.com',
        },
      },
    ],
    inherit: [
      {
        value: 'zse9gkdu27',
        label: 'Test 5',
        icon: null,
        type: 'entity',
        inheritedValue: [
          {
            value: 1650412800,
          },
        ],
        inheritedType: 'date',
      },
    ],
    image: [
      {
        value: '/api/files/1651603234992smwovxz1mq.jpeg',
      },
    ],
    select: [
      {
        value: 'f5t0ah6aluq',
        label: 'Argentina',
      },
    ],
  },
  attachments: [
    {
      _id: '62717723ff128cfd6de09ab5',
      originalname: 'mars.jpeg',
      mimetype: 'image/jpeg',
      size: 3405,
      filename: '1651603234992smwovxz1mq.jpeg',
      entity: 'mtpkxxe1uom',
      type: 'attachment',
      creationDate: 1651603235065,
    },
    {
      _id: '62717723ff128cfd6de09ab7',
      originalname: 'sample video.mp4',
      mimetype: 'video/mp4',
      size: 1570024,
      filename: '1651603234992ndu8pskupzp.mp4',
      entity: 'mtpkxxe1uom',
      type: 'attachment',
      creationDate: 1651603235066,
    },
  ],
  __v: 0,
  relations: [
    {
      template: '626c19088a46c11701b493e6',
      entityData: {
        sharedId: 'zse9gkdu27',
        creationDate: 1651251547653,
        published: true,
        metadata: {
          date: [
            {
              value: 1650412800,
            },
          ],
          relationship_2: [
            {
              value: 'l8rnfv6qss',
              label: 'Test 4',
              icon: null,
              type: 'entity',
            },
          ],
        },
        attachments: [],
        title: 'Test 5',
        documents: [],
        template: '626c19238a46c11701b49a55',
        _id: '626c195b8a46c11701b4aaaf',
      },
      _id: '626c19658a46c11701b4aafb',
      entity: 'zse9gkdu27',
      hub: '626c19658a46c11701b4aaf5',
    },
    {
      template: null,
      entityData: {
        sharedId: 'mtpkxxe1uom',
        creationDate: 1650976400574,
        published: true,
        metadata: {
          multi_select: [
            {
              value: 'k9vqx1bkkso',
              label: 'Colombia',
            },
            {
              value: 'f5t0ah6aluq',
              label: 'Argentina',
            },
          ],
          media: [
            {
              value: '/api/files/1651603234992ndu8pskupzp.mp4',
            },
          ],
          date_range: [
            {
              value: {
                from: 1651536000,
                to: 1651708799,
              },
            },
          ],
          text: [
            {
              value: 'one',
            },
          ],
          geolocation_geolocation: [
            {
              value: {
                lat: 46.660244945286394,
                lon: 8.283691406250002,
                label: '',
              },
            },
          ],
          numeric: [
            {
              value: 1,
            },
          ],
          date: [
            {
              value: 1651536000,
            },
          ],
          rich_text: [
            {
              value: 'Test 1 long text',
            },
          ],
          multi_date_range: [
            {
              value: {
                from: 1651968000,
                to: 1652486399,
              },
            },
            {
              value: {
                from: 1652572800,
                to: 1653091199,
              },
            },
          ],
          multi_date: [
            {
              value: 1651622400,
            },
            {
              value: 1651708800,
            },
          ],
          relationship: [
            {
              value: 'zse9gkdu27',
              label: 'Test 5',
              icon: null,
              type: 'entity',
            },
          ],
          link: [
            {
              value: {
                label: 'test',
                url: 'https://google.com',
              },
            },
          ],
          inherit: [
            {
              value: 'zse9gkdu27',
              label: 'Test 5',
              icon: null,
              type: 'entity',
              inheritedValue: [
                {
                  value: 1650412800,
                },
              ],
              inheritedType: 'date',
            },
          ],
          image: [
            {
              value: '/api/files/1651603234992smwovxz1mq.jpeg',
            },
          ],
          select: [
            {
              value: 'f5t0ah6aluq',
              label: 'Argentina',
            },
          ],
        },
        attachments: [
          {
            _id: '62717723ff128cfd6de09ab5',
            originalname: 'mars.jpeg',
            mimetype: 'image/jpeg',
            size: 3405,
            filename: '1651603234992smwovxz1mq.jpeg',
            entity: 'mtpkxxe1uom',
            type: 'attachment',
            creationDate: 1651603235065,
          },
          {
            _id: '62717723ff128cfd6de09ab7',
            originalname: 'sample video.mp4',
            mimetype: 'video/mp4',
            size: 1570024,
            filename: '1651603234992ndu8pskupzp.mp4',
            entity: 'mtpkxxe1uom',
            type: 'attachment',
            creationDate: 1651603235066,
          },
        ],
        title: 'Test 1',
        documents: [],
        template: '5bfbb1a0471dd0fc16ada146',
        _id: '6267e69026904c252518f946',
      },
      _id: '626c19658a46c11701b4aafa',
      entity: 'mtpkxxe1uom',
      hub: '626c19658a46c11701b4aaf5',
    },
  ],
  editDate: 1651603235026,
  title: 'Test 1',
  documents: [],
  language: 'en',
  template: '5bfbb1a0471dd0fc16ada146',
  _id: '6267e69026904c252518f946',
};

const thesauri = Immutable.fromJS([
  {
    _id: '626825379c8a75a1ea9a821e',
    values: [
      { label: 'Argentina', id: 'f5t0ah6aluq' },
      { label: 'Peru', id: 'agq2wnfyism' },
      { label: 'Colombia', id: 'k9vqx1bkkso' },
      { label: 'Cambodia', id: 'yx6zptkxp7j' },
      { label: 'Puerto Rico', id: '9v2i080m3j6' },
    ],
    name: 'País',
    __v: 0,
  },
  {
    default: true,
    values: [
      { id: 'mtpkxxe1uom', label: 'Test 1' },
      { id: 'i4a5p7hnqr', label: 'Test 2' },
      { id: 'am4a13pt3b', label: 'Test 3' },
      { id: 'l8rnfv6qss', label: 'Test 4' },
    ],
    color: '#e46841',
    name: 'Document',
    optionsCount: 4,
    properties: [
      { _id: '6267e68226904c252518f914', label: 'Text', type: 'text', name: 'text', filter: true },
      {
        _id: '6267e68226904c252518f915',
        label: 'Numeric',
        type: 'numeric',
        name: 'numeric',
        filter: true,
      },
      {
        _id: '62693f2b3483cd0da78b6ffb',
        label: 'Select',
        type: 'select',
        content: '626825379c8a75a1ea9a821e',
        name: 'select',
        filter: true,
      },
      {
        _id: '627176d9ff128cfd6de09972',
        label: 'Multi Select',
        type: 'multiselect',
        content: '626825379c8a75a1ea9a821e',
        name: 'multi_select',
      },
      {
        _id: '626c191b8a46c11701b499b3',
        label: 'Relationship',
        type: 'relationship',
        content: '626c19238a46c11701b49a55',
        relationType: '626c19088a46c11701b493e6',
        name: 'relationship',
      },
      {
        _id: '626c19418a46c11701b4a390',
        label: 'Inherit',
        type: 'relationship',
        content: '626c19238a46c11701b49a55',
        relationType: '626c19088a46c11701b493e6',
        name: 'inherit',
        inherit: { property: '626c19498a46c11701b4a702', type: 'date' },
      },
      { _id: '627176d9ff128cfd6de09975', label: 'Date', type: 'date', name: 'date' },
      {
        _id: '627176d9ff128cfd6de09976',
        label: 'Date Range',
        type: 'daterange',
        name: 'date_range',
      },
      {
        _id: '627176d9ff128cfd6de09977',
        label: 'Multi Date',
        type: 'multidate',
        name: 'multi_date',
      },
      {
        _id: '627176d9ff128cfd6de09978',
        label: 'Multi Date Range',
        type: 'multidaterange',
        name: 'multi_date_range',
      },
      { _id: '627176d9ff128cfd6de09979', label: 'Rich Text', type: 'markdown', name: 'rich_text' },
      { _id: '627176d9ff128cfd6de0997a', label: 'Link', type: 'link', name: 'link' },
      { _id: '627176d9ff128cfd6de0997b', label: 'Image', type: 'image', name: 'image' },
      { _id: '627176d9ff128cfd6de0997c', label: 'Media', type: 'media', name: 'media' },
      {
        _id: '627176d9ff128cfd6de0997d',
        label: 'Geolocation',
        type: 'geolocation',
        name: 'geolocation_geolocation',
      },
    ],
    __v: 0,
    entityViewPage: '8x8b1bzsj1i',
    _id: '5bfbb1a0471dd0fc16ada146',
    type: 'template',
    commonProperties: [
      {
        _id: '5bfbb1a0471dd0fc16ada148',
        label: 'Title',
        name: 'title',
        isCommonProperty: true,
        type: 'text',
        prioritySorting: false,
      },
      {
        _id: '5bfbb1a0471dd0fc16ada147',
        label: 'Date added',
        name: 'creationDate',
        isCommonProperty: true,
        type: 'date',
        prioritySorting: false,
      },
    ],
  },
  {
    values: [{ id: 'zse9gkdu27', label: 'Test 5' }],
    color: '#D9534F',
    name: 'Document 2',
    optionsCount: 1,
    properties: [
      { _id: '626c19498a46c11701b4a702', label: 'Date', type: 'date', name: 'date' },
      {
        _id: '626c19fd8a46c11701b4aea8',
        label: 'Relationship 2',
        type: 'relationship',
        content: '5bfbb1a0471dd0fc16ada146',
        relationType: '626c19088a46c11701b493e6',
        name: 'relationship_2',
      },
    ],
    __v: 0,
    entityViewPage: '',
    _id: '626c19238a46c11701b49a55',
    type: 'template',
    commonProperties: [
      {
        _id: '626c19238a46c11701b49a56',
        label: 'Title',
        name: 'title',
        isCommonProperty: true,
        type: 'text',
        prioritySorting: false,
        generatedId: false,
      },
      {
        _id: '626c19238a46c11701b49a57',
        label: 'Date added',
        name: 'creationDate',
        isCommonProperty: true,
        type: 'date',
        prioritySorting: false,
      },
      {
        _id: '626c19238a46c11701b49a58',
        label: 'Date modified',
        name: 'editDate',
        isCommonProperty: true,
        type: 'date',
        prioritySorting: false,
      },
    ],
  },
]);

const expectedFormattedEntity = {
  metadata: {
    character_description: {
      translateContext: '626f3efb389811b044569513',
      label: 'Character description',
      name: 'character_description',
      type: 'inherit',
      value: [
        {
          value: 'Criminal mastermind',
        },
      ],
      inheritedType: 'text',
      onlyForCards: false,
      indexInTemplate: 0,
    },
    main_enemy: {
      translateContext: '626f4019389811b04456ab95',
      _id: '626f40f4389811b04456bc33',
      label: 'Main enemy',
      type: 'relationship',
      content: '626f3f85389811b04456a0cd',
      relationType: '626f3f7a389811b044569db9',
      name: 'main_enemy',
      indexInTemplate: 1,
      value: [
        {
          value: 'Batman hero',
          url: '/entity/v5g098ioqe',
          icon: null,
          relatedEntity: {
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
        },
      ],
    },
    main_colors: {
      translateContext: '626f4019389811b04456ab95',
      _id: '626f4122389811b04456c2b4',
      label: 'Main colors',
      type: 'multiselect',
      content: '626f40c7389811b04456b5b5',
      name: 'main_colors',
      indexInTemplate: 2,
      value: [
        {
          value: 'Blue',
        },
        {
          value: 'Red',
        },
      ],
    },
    comic_dates: {
      translateContext: '626f4019389811b04456ab95',
      _id: '626f4341389811b04456d3c4',
      label: 'Comic dates',
      type: 'multidaterange',
      name: 'comic_dates',
      indexInTemplate: 3,
      value: [
        {
          value: 'Apr 2, 2018 ~ May 31, 2022',
        },
        {
          value: 'May 15, 2013 ~ May 14, 2014',
        },
      ],
    },
  },
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
  documentType: 'Villian',
};

export { dbTemplate, dbEntity, thesauri, expectedFormattedEntity };
