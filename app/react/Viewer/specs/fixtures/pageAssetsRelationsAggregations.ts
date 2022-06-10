/* eslint-disable max-lines */
import Immutable from 'immutable';
import { ClientTemplateSchema } from 'app/istore';
import { EntitySchema } from 'shared/types/entityType';
import { IImmutable } from 'shared/types/Immutable';

const dbTemplates: IImmutable<ClientTemplateSchema[]> = Immutable.fromJS([
  {
    _id: '629e567fd4242c571392f548',
    color: '#D9534F',
    entityViewPage: 'hetu84j0k47',
    name: 'Document with relations',
    properties: [
      {
        _id: '629e567fd4242c571392f549',
        label: 'iText',
        type: 'relationship',
        inherit: { property: '629e5634d4242c571392f43e', type: 'text' },
        content: '5bfbb1a0471dd0fc16ada146',
        relationType: '629e55f1d4242c571392d5fc',
        showInCard: true,
        name: 'itext',
      },
      {
        _id: '629e567fd4242c571392f54a',
        label: 'iNumeric',
        type: 'relationship',
        inherit: { property: '629e5634d4242c571392f43f', type: 'numeric' },
        content: '5bfbb1a0471dd0fc16ada146',
        relationType: '629e55f1d4242c571392d5fc',
        showInCard: true,
        name: 'inumeric',
      },
      {
        _id: '629e567fd4242c571392f54b',
        label: 'iSelect',
        type: 'relationship',
        inherit: { property: '629e5634d4242c571392f440', type: 'select' },
        content: '5bfbb1a0471dd0fc16ada146',
        relationType: '629e55f1d4242c571392d5fc',
        showInCard: true,
        name: 'iselect',
      },
      {
        _id: '629f8fa7988b5431324d858b',
        label: 'Description',
        type: 'markdown',
        name: 'description',
      },
      {
        _id: '629f905738ef5b334384a85c',
        label: 'iGeolocation',
        type: 'relationship',
        inherit: { property: '629f900638ef5b3343848e81', type: 'geolocation' },
        content: '629f900638ef5b3343848e80',
        relationType: '629f902238ef5b3343849b62',
        showInCard: true,
        name: 'igeolocation',
      },
      {
        _id: '629f905738ef5b334384a85d',
        label: 'iSelect-country',
        type: 'relationship',
        inherit: { property: '629f900d38ef5b3343849aeb', type: 'select' },
        content: '629f900638ef5b3343848e80',
        relationType: '629f902238ef5b3343849b62',
        showInCard: true,
        name: 'iselect-country',
      },
    ],
    commonProperties: [
      {
        _id: '629e567fd4242c571392f54c',
        label: 'Title',
        name: 'title',
        isCommonProperty: true,
        type: 'text',
        prioritySorting: false,
        generatedId: false,
      },
      {
        _id: '629e567fd4242c571392f54d',
        label: 'Date added',
        name: 'creationDate',
        isCommonProperty: true,
        type: 'date',
        prioritySorting: false,
      },
      {
        _id: '629e567fd4242c571392f54e',
        label: 'Date modified',
        name: 'editDate',
        isCommonProperty: true,
        type: 'date',
        prioritySorting: false,
      },
    ],
  },
  {
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
      {
        _id: '629e5634d4242c571392f43e',
        label: 'Text',
        type: 'text',
        name: 'text',
        showInCard: true,
      },
      {
        _id: '629e5634d4242c571392f43f',
        label: 'Numeric',
        type: 'numeric',
        name: 'numeric',
        showInCard: true,
      },
      {
        _id: '629e5634d4242c571392f440',
        label: 'Select',
        type: 'select',
        content: '629e5625d4242c571392e824',
        name: 'select',
        showInCard: true,
      },
    ],
    default: true,
    color: '#c03b22',
  },
  {
    _id: '629f900638ef5b3343848e80',
    color: '#E91E63',
    entityViewPage: '',
    name: 'Countries',
    properties: [
      {
        _id: '629f900638ef5b3343848e81',
        label: 'Geolocation',
        type: 'geolocation',
        name: 'geolocation_geolocation',
      },
      {
        _id: '629f900d38ef5b3343849aeb',
        label: 'Select',
        type: 'select',
        content: '629e5625d4242c571392e824',
        name: 'select',
      },
    ],
    commonProperties: [
      {
        _id: '629f900638ef5b3343848e82',
        label: 'Title',
        name: 'title',
        isCommonProperty: true,
        type: 'text',
        prioritySorting: false,
        generatedId: false,
      },
      {
        _id: '629f900638ef5b3343848e83',
        label: 'Date added',
        name: 'creationDate',
        isCommonProperty: true,
        type: 'date',
        prioritySorting: false,
      },
      {
        _id: '629f900638ef5b3343848e84',
        label: 'Date modified',
        name: 'editDate',
        isCommonProperty: true,
        type: 'date',
        prioritySorting: false,
      },
    ],
  },
  {
    _id: '62a34533100b901027a250e6',
    color: '#A03AB1',
    entityViewPage: 'hetu84j0k47',
    name: 'Other document with relations',
    properties: [
      {
        _id: '62a34533100b901027a250e7',
        label: 'Multi-inherit text',
        type: 'relationship',
        inherit: {
          property: '629e5634d4242c571392f43e',
          type: 'text',
        },
        content: '5bfbb1a0471dd0fc16ada146',
        relationType: '629e55f1d4242c571392d5fc',
        showInCard: true,
        name: 'multi-inherit_text',
      },
      {
        _id: '62a34533100b901027a250e8',
        label: 'Multi-inherit number',
        type: 'relationship',
        inherit: {
          property: '629e5634d4242c571392f43f',
          type: 'numeric',
        },
        content: '5bfbb1a0471dd0fc16ada146',
        relationType: '629e55f1d4242c571392d5fc',
        showInCard: true,
        name: 'multi-inherit_number',
      },
      {
        _id: '62a34533100b901027a250e9',
        label: 'Multi-inherit geo',
        type: 'relationship',
        inherit: {
          property: '629f900638ef5b3343848e81',
          type: 'geolocation',
        },
        content: '629f900638ef5b3343848e80',
        relationType: '629e55f1d4242c571392d5fc',
        showInCard: true,
        name: 'multi-inherit_geo',
      },
    ],
    commonProperties: [
      {
        _id: '62a34533100b901027a250ea',
        label: 'Title',
        name: 'title',
        isCommonProperty: true,
        type: 'text',
        prioritySorting: false,
        generatedId: false,
      },
      {
        _id: '62a34533100b901027a250eb',
        label: 'Date added',
        name: 'creationDate',
        isCommonProperty: true,
        type: 'date',
        prioritySorting: false,
      },
      {
        _id: '62a34533100b901027a250ec',
        label: 'Date modified',
        name: 'editDate',
        isCommonProperty: true,
        type: 'date',
        prioritySorting: false,
      },
    ],
    __v: 0,
  },
]);

const thesauris = Immutable.fromJS([
  {
    _id: '629e5625d4242c571392e824',
    values: [
      { label: 'Option A', id: 'aot0horszdt' },
      { label: 'Option B', id: '92lfe31qc3n' },
      { label: 'Option C', id: 'e5cgnczmfys' },
      {
        label: 'Option D',
        id: 'craucpftwy',
        values: [
          { label: 'Option D 1', id: 'c9cf2utpe8u' },
          { label: 'Option D 2', id: 'eeb2dlx1bu6' },
          { label: 'Option D 3', id: 'xtevnrb2x1o' },
        ],
      },
    ],
    name: 'Selector',
  },
  {
    default: true,
    values: [
      { id: 'f27fwxhlsqo', label: 'Document 1' },
      { id: 'u4uclgwzcp', label: 'Document 2' },
      { id: '844ts659a7', label: 'Document 3' },
      { id: '4qkgragsevq', label: 'Document 4' },
    ],
    color: '#c03b22',
    name: 'Document',
    optionsCount: 4,
    properties: [
      {
        _id: '629e5634d4242c571392f43e',
        label: 'Text',
        type: 'text',
        name: 'text',
        showInCard: true,
      },
      {
        _id: '629e5634d4242c571392f43f',
        label: 'Numeric',
        type: 'numeric',
        name: 'numeric',
        showInCard: true,
      },
      {
        _id: '629e5634d4242c571392f440',
        label: 'Select',
        type: 'select',
        content: '629e5625d4242c571392e824',
        name: 'select',
        showInCard: true,
      },
    ],

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
    values: [
      { id: 's07ki698a69', label: 'iDocument 1' },
      { id: 'ayvlz9vy4vq', label: 'iDocument 2' },
    ],
    color: '#D9534F',
    name: 'Document with relations',
    optionsCount: 2,
    properties: [
      {
        _id: '629e567fd4242c571392f549',
        label: 'iText',
        type: 'relationship',
        inherit: { property: '629e5634d4242c571392f43e', type: 'text' },
        content: '5bfbb1a0471dd0fc16ada146',
        relationType: '629e55f1d4242c571392d5fc',
        showInCard: true,
        name: 'itext',
      },
      {
        _id: '629e567fd4242c571392f54a',
        label: 'iNumeric',
        type: 'relationship',
        inherit: { property: '629e5634d4242c571392f43f', type: 'numeric' },
        content: '5bfbb1a0471dd0fc16ada146',
        relationType: '629e55f1d4242c571392d5fc',
        showInCard: true,
        name: 'inumeric',
      },
      {
        _id: '629e567fd4242c571392f54b',
        label: 'iSelect',
        type: 'relationship',
        inherit: { property: '629e5634d4242c571392f440', type: 'select' },
        content: '5bfbb1a0471dd0fc16ada146',
        relationType: '629e55f1d4242c571392d5fc',
        showInCard: true,
        name: 'iselect',
      },
      {
        _id: '629f8fa7988b5431324d858b',
        label: 'Description',
        type: 'markdown',
        name: 'description',
      },
      {
        _id: '629f905738ef5b334384a85c',
        label: 'iGeolocation',
        type: 'relationship',
        inherit: { property: '629f900638ef5b3343848e81', type: 'geolocation' },
        content: '629f900638ef5b3343848e80',
        relationType: '629f902238ef5b3343849b62',
        showInCard: true,
        name: 'igeolocation',
      },
      {
        _id: '629f905738ef5b334384a85d',
        label: 'iSelect-country',
        type: 'relationship',
        inherit: { property: '629f900d38ef5b3343849aeb', type: 'select' },
        content: '629f900638ef5b3343848e80',
        relationType: '629f902238ef5b3343849b62',
        showInCard: true,
        name: 'iselect-country',
      },
    ],

    entityViewPage: 'hetu84j0k47',
    _id: '629e567fd4242c571392f548',
    type: 'template',
    commonProperties: [
      {
        _id: '629e567fd4242c571392f54c',
        label: 'Title',
        name: 'title',
        isCommonProperty: true,
        type: 'text',
        prioritySorting: false,
        generatedId: false,
      },
      {
        _id: '629e567fd4242c571392f54d',
        label: 'Date added',
        name: 'creationDate',
        isCommonProperty: true,
        type: 'date',
        prioritySorting: false,
      },
      {
        _id: '629e567fd4242c571392f54e',
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
      { id: '9e13muy08kl', label: 'Argentina' },
      { id: '3zeqx3aptzi', label: 'Peru' },
      { id: 'ckww13sin9', label: 'Bolivia' },
      { id: 'mp9v2ugx1un', label: 'Venezuela' },
    ],
    color: '#E91E63',
    name: 'Countries',
    optionsCount: 4,
    properties: [
      {
        _id: '629f900638ef5b3343848e81',
        label: 'Geolocation',
        type: 'geolocation',
        name: 'geolocation_geolocation',
      },
      {
        _id: '629f900d38ef5b3343849aeb',
        label: 'Select',
        type: 'select',
        content: '629e5625d4242c571392e824',
        name: 'select',
      },
    ],

    entityViewPage: '',
    _id: '629f900638ef5b3343848e80',
    type: 'template',
    commonProperties: [
      {
        _id: '629f900638ef5b3343848e82',
        label: 'Title',
        name: 'title',
        isCommonProperty: true,
        type: 'text',
        prioritySorting: false,
        generatedId: false,
      },
      {
        _id: '629f900638ef5b3343848e83',
        label: 'Date added',
        name: 'creationDate',
        isCommonProperty: true,
        type: 'date',
        prioritySorting: false,
      },
      {
        _id: '629f900638ef5b3343848e84',
        label: 'Date modified',
        name: 'editDate',
        isCommonProperty: true,
        type: 'date',
        prioritySorting: false,
      },
    ],
  },
]);

const rawEntities: EntitySchema[] = [
  {
    _id: '629e5712d4242c571392fcd4',
    template: '629e567fd4242c571392f548',
    title: 'iDocument 1',
    user: '58ada34d299e82674854510f',
    creationDate: 1654544146164,
    published: false,
    editDate: 1654624436122,
    language: 'en',
    sharedId: 's07ki698a69',
    permissions: [{ refId: '58ada34d299e82674854510f', type: 'user', level: 'write' }],

    documents: [],
    attachments: [],
    metadata: {
      itext: [
        {
          value: '844ts659a7',
          label: 'Document 3',
          icon: null,
          type: 'entity',
          inheritedValue: [{ value: 'Three' }],
          inheritedType: 'text',
        },
        {
          value: 'f27fwxhlsqo',
          label: 'Document 1',
          icon: null,
          type: 'entity',
          inheritedValue: [{ value: 'One' }],
          inheritedType: 'text',
        },
        {
          value: 'u4uclgwzcp',
          label: 'Document 2',
          icon: null,
          type: 'entity',
          inheritedValue: [{ value: 'Two' }],
          inheritedType: 'text',
        },
        {
          value: '4qkgragsevq',
          label: 'Document 4',
          icon: null,
          type: 'entity',
          inheritedValue: [{ value: 'Four' }],
          inheritedType: 'text',
        },
      ],
      inumeric: [
        {
          value: '844ts659a7',
          label: 'Document 3',
          icon: null,
          type: 'entity',
          inheritedValue: [{ value: 3 }],
          inheritedType: 'numeric',
        },
        {
          value: 'f27fwxhlsqo',
          label: 'Document 1',
          icon: null,
          type: 'entity',
          inheritedValue: [{ value: 1 }],
          inheritedType: 'numeric',
        },
        {
          value: 'u4uclgwzcp',
          label: 'Document 2',
          icon: null,
          type: 'entity',
          inheritedValue: [{ value: 2 }],
          inheritedType: 'numeric',
        },
        {
          value: '4qkgragsevq',
          label: 'Document 4',
          icon: null,
          type: 'entity',
          inheritedValue: [{ value: 4 }],
          inheritedType: 'numeric',
        },
      ],
      iselect: [
        {
          value: '844ts659a7',
          label: 'Document 3',
          icon: null,
          type: 'entity',
          inheritedValue: [{ value: 'e5cgnczmfys', label: 'Option C' }],
          inheritedType: 'select',
        },
        {
          value: 'f27fwxhlsqo',
          label: 'Document 1',
          icon: null,
          type: 'entity',
          inheritedValue: [{ value: 'aot0horszdt', label: 'Option A' }],
          inheritedType: 'select',
        },
        {
          value: 'u4uclgwzcp',
          label: 'Document 2',
          icon: null,
          type: 'entity',
          inheritedValue: [{ value: '92lfe31qc3n', label: 'Option B' }],
          inheritedType: 'select',
        },
        {
          value: '4qkgragsevq',
          label: 'Document 4',
          icon: null,
          type: 'entity',
          inheritedValue: [
            {
              value: 'c9cf2utpe8u',
              label: 'Option D 1',
              parent: { value: 'craucpftwy', label: 'Option D' },
            },
          ],
          inheritedType: 'select',
        },
      ],
      'iselect-country': [
        {
          value: '9e13muy08kl',
          label: 'Argentina',
          icon: null,
          type: 'entity',
          inheritedValue: [
            {
              value: 'xtevnrb2x1o',
              label: 'Option D 3',
              parent: { value: 'craucpftwy', label: 'Option D' },
            },
          ],
          inheritedType: 'select',
        },
        {
          value: '3zeqx3aptzi',
          label: 'Peru',
          icon: null,
          type: 'entity',
          inheritedValue: [{ value: '92lfe31qc3n', label: 'Option B' }],
          inheritedType: 'select',
        },
      ],
      igeolocation: [
        {
          value: '9e13muy08kl',
          label: 'Argentina',
          icon: null,
          type: 'entity',
          inheritedValue: [
            { value: { lat: -36.19286487671368, lon: -64.29199218750001, label: '' } },
          ],
          inheritedType: 'geolocation',
        },
        {
          value: '3zeqx3aptzi',
          label: 'Peru',
          icon: null,
          type: 'entity',
          inheritedValue: [
            { value: { lat: -10.189511603370525, lon: -74.97070312500001, label: '' } },
          ],
          inheritedType: 'geolocation',
        },
      ],
    },
    relations: [
      {
        template: null,
        entityData: {
          _id: '629e5712d4242c571392fcd4',
          metadata: {
            itext: [
              {
                value: '844ts659a7',
                label: 'Document 3',
                icon: null,
                type: 'entity',
                inheritedValue: [{ value: 'Three' }],
                inheritedType: 'text',
              },
              {
                value: 'f27fwxhlsqo',
                label: 'Document 1',
                icon: null,
                type: 'entity',
                inheritedValue: [{ value: 'One' }],
                inheritedType: 'text',
              },
              {
                value: 'u4uclgwzcp',
                label: 'Document 2',
                icon: null,
                type: 'entity',
                inheritedValue: [{ value: 'Two' }],
                inheritedType: 'text',
              },
              {
                value: '4qkgragsevq',
                label: 'Document 4',
                icon: null,
                type: 'entity',
                inheritedValue: [{ value: 'Four' }],
                inheritedType: 'text',
              },
            ],
            inumeric: [
              {
                value: '844ts659a7',
                label: 'Document 3',
                icon: null,
                type: 'entity',
                inheritedValue: [{ value: 3 }],
                inheritedType: 'numeric',
              },
              {
                value: 'f27fwxhlsqo',
                label: 'Document 1',
                icon: null,
                type: 'entity',
                inheritedValue: [{ value: 1 }],
                inheritedType: 'numeric',
              },
              {
                value: 'u4uclgwzcp',
                label: 'Document 2',
                icon: null,
                type: 'entity',
                inheritedValue: [{ value: 2 }],
                inheritedType: 'numeric',
              },
              {
                value: '4qkgragsevq',
                label: 'Document 4',
                icon: null,
                type: 'entity',
                inheritedValue: [{ value: 4 }],
                inheritedType: 'numeric',
              },
            ],
            iselect: [
              {
                value: '844ts659a7',
                label: 'Document 3',
                icon: null,
                type: 'entity',
                inheritedValue: [{ value: 'e5cgnczmfys', label: 'Option C' }],
                inheritedType: 'select',
              },
              {
                value: 'f27fwxhlsqo',
                label: 'Document 1',
                icon: null,
                type: 'entity',
                inheritedValue: [{ value: 'aot0horszdt', label: 'Option A' }],
                inheritedType: 'select',
              },
              {
                value: 'u4uclgwzcp',
                label: 'Document 2',
                icon: null,
                type: 'entity',
                inheritedValue: [{ value: '92lfe31qc3n', label: 'Option B' }],
                inheritedType: 'select',
              },
              {
                value: '4qkgragsevq',
                label: 'Document 4',
                icon: null,
                type: 'entity',
                inheritedValue: [
                  {
                    value: 'c9cf2utpe8u',
                    label: 'Option D 1',
                    parent: { value: 'craucpftwy', label: 'Option D' },
                  },
                ],
                inheritedType: 'select',
              },
            ],
            'iselect-country': [
              {
                value: '9e13muy08kl',
                label: 'Argentina',
                icon: null,
                type: 'entity',
                inheritedValue: [
                  {
                    value: 'xtevnrb2x1o',
                    label: 'Option D 3',
                    parent: { value: 'craucpftwy', label: 'Option D' },
                  },
                ],
                inheritedType: 'select',
              },
              {
                value: '3zeqx3aptzi',
                label: 'Peru',
                icon: null,
                type: 'entity',
                inheritedValue: [{ value: '92lfe31qc3n', label: 'Option B' }],
                inheritedType: 'select',
              },
            ],
            igeolocation: [
              {
                value: '9e13muy08kl',
                label: 'Argentina',
                icon: null,
                type: 'entity',
                inheritedValue: [
                  { value: { lat: -36.19286487671368, lon: -64.29199218750001, label: '' } },
                ],
                inheritedType: 'geolocation',
              },
              {
                value: '3zeqx3aptzi',
                label: 'Peru',
                icon: null,
                type: 'entity',
                inheritedValue: [
                  { value: { lat: -10.189511603370525, lon: -74.97070312500001, label: '' } },
                ],
                inheritedType: 'geolocation',
              },
            ],
          },
          template: '629e567fd4242c571392f548',
          title: 'iDocument 1',
          creationDate: 1654544146164,
          published: false,
          sharedId: 's07ki698a69',
          documents: [],
          attachments: [],
        },
        _id: '629e5712d4242c571392fce2',
        entity: 's07ki698a69',
        hub: '629e5712d4242c571392fcdd',
      },
      {
        template: '629e55f1d4242c571392d5fc',
        entityData: {
          _id: '629e56c4d4242c571392fc6d',
          metadata: {
            text: [{ value: 'Three' }],
            numeric: [{ value: 3 }],
            select: [{ value: 'e5cgnczmfys', label: 'Option C' }],
          },
          template: '5bfbb1a0471dd0fc16ada146',
          title: 'Document 3',
          creationDate: 1654544068027,
          published: false,
          sharedId: '844ts659a7',
          documents: [],
          attachments: [],
        },
        _id: '629e5712d4242c571392fce4',
        entity: '844ts659a7',
        hub: '629e5712d4242c571392fcdd',
      },
      {
        template: '629e55f1d4242c571392d5fc',
        entityData: {
          _id: '629e56a1d4242c571392fc07',
          metadata: {
            text: [{ value: 'One' }],
            numeric: [{ value: 1 }],
            select: [{ value: 'aot0horszdt', label: 'Option A' }],
          },
          template: '5bfbb1a0471dd0fc16ada146',
          title: 'Document 1',
          creationDate: 1654544033340,
          published: false,
          sharedId: 'f27fwxhlsqo',
          documents: [],
          attachments: [],
        },
        _id: '629e5712d4242c571392fce3',
        entity: 'f27fwxhlsqo',
        hub: '629e5712d4242c571392fcdd',
      },
      {
        template: '629e55f1d4242c571392d5fc',
        entityData: {
          _id: '629e56aed4242c571392fc3f',
          metadata: {
            text: [{ value: 'Two' }],
            numeric: [{ value: 2 }],
            select: [{ value: '92lfe31qc3n', label: 'Option B' }],
          },
          template: '5bfbb1a0471dd0fc16ada146',
          title: 'Document 2',
          creationDate: 1654544046076,
          published: false,
          sharedId: 'u4uclgwzcp',
          documents: [],
          attachments: [],
        },
        _id: '629e5712d4242c571392fce5',
        entity: 'u4uclgwzcp',
        hub: '629e5712d4242c571392fcdd',
      },
      {
        template: '629e55f1d4242c571392d5fc',
        entityData: {
          _id: '629e56d2d4242c571392fc9b',
          metadata: {
            text: [{ value: 'Four' }],
            numeric: [{ value: 4 }],
            select: [
              {
                value: 'c9cf2utpe8u',
                label: 'Option D 1',
                parent: { value: 'craucpftwy', label: 'Option D' },
              },
            ],
          },
          template: '5bfbb1a0471dd0fc16ada146',
          title: 'Document 4',
          creationDate: 1654544082896,
          published: false,
          sharedId: '4qkgragsevq',
          documents: [],
          attachments: [],
        },
        _id: '629e5712d4242c571392fce6',
        entity: '4qkgragsevq',
        hub: '629e5712d4242c571392fcdd',
      },
      {
        template: null,
        entityData: {
          _id: '629e5712d4242c571392fcd4',
          metadata: {
            itext: [
              {
                value: '844ts659a7',
                label: 'Document 3',
                icon: null,
                type: 'entity',
                inheritedValue: [{ value: 'Three' }],
                inheritedType: 'text',
              },
              {
                value: 'f27fwxhlsqo',
                label: 'Document 1',
                icon: null,
                type: 'entity',
                inheritedValue: [{ value: 'One' }],
                inheritedType: 'text',
              },
              {
                value: 'u4uclgwzcp',
                label: 'Document 2',
                icon: null,
                type: 'entity',
                inheritedValue: [{ value: 'Two' }],
                inheritedType: 'text',
              },
              {
                value: '4qkgragsevq',
                label: 'Document 4',
                icon: null,
                type: 'entity',
                inheritedValue: [{ value: 'Four' }],
                inheritedType: 'text',
              },
            ],
            inumeric: [
              {
                value: '844ts659a7',
                label: 'Document 3',
                icon: null,
                type: 'entity',
                inheritedValue: [{ value: 3 }],
                inheritedType: 'numeric',
              },
              {
                value: 'f27fwxhlsqo',
                label: 'Document 1',
                icon: null,
                type: 'entity',
                inheritedValue: [{ value: 1 }],
                inheritedType: 'numeric',
              },
              {
                value: 'u4uclgwzcp',
                label: 'Document 2',
                icon: null,
                type: 'entity',
                inheritedValue: [{ value: 2 }],
                inheritedType: 'numeric',
              },
              {
                value: '4qkgragsevq',
                label: 'Document 4',
                icon: null,
                type: 'entity',
                inheritedValue: [{ value: 4 }],
                inheritedType: 'numeric',
              },
            ],
            iselect: [
              {
                value: '844ts659a7',
                label: 'Document 3',
                icon: null,
                type: 'entity',
                inheritedValue: [{ value: 'e5cgnczmfys', label: 'Option C' }],
                inheritedType: 'select',
              },
              {
                value: 'f27fwxhlsqo',
                label: 'Document 1',
                icon: null,
                type: 'entity',
                inheritedValue: [{ value: 'aot0horszdt', label: 'Option A' }],
                inheritedType: 'select',
              },
              {
                value: 'u4uclgwzcp',
                label: 'Document 2',
                icon: null,
                type: 'entity',
                inheritedValue: [{ value: '92lfe31qc3n', label: 'Option B' }],
                inheritedType: 'select',
              },
              {
                value: '4qkgragsevq',
                label: 'Document 4',
                icon: null,
                type: 'entity',
                inheritedValue: [
                  {
                    value: 'c9cf2utpe8u',
                    label: 'Option D 1',
                    parent: { value: 'craucpftwy', label: 'Option D' },
                  },
                ],
                inheritedType: 'select',
              },
            ],
            'iselect-country': [
              {
                value: '9e13muy08kl',
                label: 'Argentina',
                icon: null,
                type: 'entity',
                inheritedValue: [
                  {
                    value: 'xtevnrb2x1o',
                    label: 'Option D 3',
                    parent: { value: 'craucpftwy', label: 'Option D' },
                  },
                ],
                inheritedType: 'select',
              },
              {
                value: '3zeqx3aptzi',
                label: 'Peru',
                icon: null,
                type: 'entity',
                inheritedValue: [{ value: '92lfe31qc3n', label: 'Option B' }],
                inheritedType: 'select',
              },
            ],
            igeolocation: [
              {
                value: '9e13muy08kl',
                label: 'Argentina',
                icon: null,
                type: 'entity',
                inheritedValue: [
                  { value: { lat: -36.19286487671368, lon: -64.29199218750001, label: '' } },
                ],
                inheritedType: 'geolocation',
              },
              {
                value: '3zeqx3aptzi',
                label: 'Peru',
                icon: null,
                type: 'entity',
                inheritedValue: [
                  { value: { lat: -10.189511603370525, lon: -74.97070312500001, label: '' } },
                ],
                inheritedType: 'geolocation',
              },
            ],
          },
          template: '629e567fd4242c571392f548',
          title: 'iDocument 1',
          creationDate: 1654544146164,
          published: false,
          sharedId: 's07ki698a69',
          documents: [],
          attachments: [],
        },
        _id: '629f90b438ef5b334384a9e9',
        entity: 's07ki698a69',
        hub: '629f90b438ef5b334384a9e4',
      },
      {
        template: '629f902238ef5b3343849b62',
        entityData: {
          _id: '629f906e38ef5b334384a8eb',
          metadata: {
            select: [
              {
                value: 'xtevnrb2x1o',
                label: 'Option D 3',
                parent: { value: 'craucpftwy', label: 'Option D' },
              },
            ],
            geolocation_geolocation: [
              { value: { lat: -36.19286487671368, lon: -64.29199218750001, label: '' } },
            ],
          },
          template: '629f900638ef5b3343848e80',
          title: 'Argentina',
          creationDate: 1654624366082,
          published: false,
          sharedId: '9e13muy08kl',
          documents: [],
          attachments: [],
        },
        _id: '629f90b438ef5b334384a9ea',
        entity: '9e13muy08kl',
        hub: '629f90b438ef5b334384a9e4',
      },
      {
        template: '629f902238ef5b3343849b62',
        entityData: {
          _id: '629f907f38ef5b334384a919',
          metadata: {
            select: [{ value: '92lfe31qc3n', label: 'Option B' }],
            geolocation_geolocation: [
              { value: { lat: -10.189511603370525, lon: -74.97070312500001, label: '' } },
            ],
          },
          template: '629f900638ef5b3343848e80',
          title: 'Peru',
          creationDate: 1654624383651,
          published: false,
          sharedId: '3zeqx3aptzi',
          documents: [],
          attachments: [],
        },
        _id: '629f90b438ef5b334384a9eb',
        entity: '3zeqx3aptzi',
        hub: '629f90b438ef5b334384a9e4',
      },
    ],
  },
  {
    _id: '629f8ec82157cf2c185e0bf1',
    template: '629e567fd4242c571392f548',
    title: 'iDocument 2',
    user: '58ada34d299e82674854510f',
    creationDate: 1654623944592,
    published: false,
    editDate: 1654624452397,
    language: 'en',
    sharedId: 'ayvlz9vy4vq',
    permissions: [{ refId: '58ada34d299e82674854510f', type: 'user', level: 'write' }],

    documents: [],
    attachments: [],
    metadata: {
      'iselect-country': [
        {
          value: 'mp9v2ugx1un',
          label: 'Venezuela',
          icon: null,
          type: 'entity',
          inheritedValue: [
            {
              value: 'eeb2dlx1bu6',
              label: 'Option D 2',
              parent: { value: 'craucpftwy', label: 'Option D' },
            },
          ],
          inheritedType: 'select',
        },
      ],
      igeolocation: [
        {
          value: 'mp9v2ugx1un',
          label: 'Venezuela',
          icon: null,
          type: 'entity',
          inheritedValue: [
            { value: { lat: 7.9243233190236015, lon: -65.47851562500001, label: '' } },
          ],
          inheritedType: 'geolocation',
        },
      ],
      description: [{ value: 'Some long text' }],
    },
    relations: [
      {
        template: null,
        entityData: {
          _id: '629f8ec82157cf2c185e0bf1',
          metadata: {
            'iselect-country': [
              {
                value: 'mp9v2ugx1un',
                label: 'Venezuela',
                icon: null,
                type: 'entity',
                inheritedValue: [
                  {
                    value: 'eeb2dlx1bu6',
                    label: 'Option D 2',
                    parent: { value: 'craucpftwy', label: 'Option D' },
                  },
                ],
                inheritedType: 'select',
              },
            ],
            igeolocation: [
              {
                value: 'mp9v2ugx1un',
                label: 'Venezuela',
                icon: null,
                type: 'entity',
                inheritedValue: [
                  { value: { lat: 7.9243233190236015, lon: -65.47851562500001, label: '' } },
                ],
                inheritedType: 'geolocation',
              },
            ],
            description: [{ value: 'Some long text' }],
          },
          template: '629e567fd4242c571392f548',
          title: 'iDocument 2',
          creationDate: 1654623944592,
          published: false,
          sharedId: 'ayvlz9vy4vq',
          documents: [],
          attachments: [],
        },
        _id: '629f90c438ef5b334384aa4b',
        entity: 'ayvlz9vy4vq',
        hub: '629f90c438ef5b334384aa46',
      },
      {
        template: '629f902238ef5b3343849b62',
        entityData: {
          _id: '629f90a538ef5b334384a973',
          metadata: {
            select: [
              {
                value: 'eeb2dlx1bu6',
                label: 'Option D 2',
                parent: { value: 'craucpftwy', label: 'Option D' },
              },
            ],
            geolocation_geolocation: [
              { value: { lat: 7.9243233190236015, lon: -65.47851562500001, label: '' } },
            ],
          },
          template: '629f900638ef5b3343848e80',
          title: 'Venezuela',
          creationDate: 1654624421257,
          published: false,
          sharedId: 'mp9v2ugx1un',
          documents: [],
          attachments: [],
        },
        _id: '629f90c438ef5b334384aa4c',
        entity: 'mp9v2ugx1un',
        hub: '629f90c438ef5b334384aa46',
      },
    ],
  },
  {
    _id: '62a0d232d00ef468a25bfe0c',
    template: '629e567fd4242c571392f548',
    title: 'iDocument 3',
    user: '58ada34d299e82674854510f',
    creationDate: 1654706738101,
    published: false,
    editDate: 1654706738103,
    language: 'en',
    sharedId: '6vad5znb6c',
    permissions: [{ refId: '58ada34d299e82674854510f', type: 'user', level: 'write' }],

    documents: [],
    attachments: [],
    metadata: {
      itext: [],
      inumeric: [],
      iselect: [],
      description: [{ value: 'Just some text' }],
      igeolocation: [],
      'iselect-country': [],
    },
    relations: [],
  },
  {
    _id: '62a3459f25e55412954d774b',
    template: '62a34533100b901027a250e6',
    title: 'Other iDcoument 1',
    user: '58ada34d299e82674854510f',
    creationDate: 1654867359008,
    published: false,
    editDate: 1654867359009,
    language: 'en',
    sharedId: 'k60i7wxo9vc',
    permissions: [
      {
        refId: '58ada34d299e82674854510f',
        type: 'user',
        level: 'write',
      },
    ],
    documents: [],
    attachments: [],
    relations: [
      {
        template: '629e55f1d4242c571392d5fc',
        entityData: {
          _id: '629e56c4d4242c571392fc6d',
          metadata: {
            text: [
              {
                value: 'Three',
              },
            ],
            numeric: [
              {
                value: 3,
              },
            ],
            select: [
              {
                value: 'e5cgnczmfys',
                label: 'Option C',
              },
            ],
            multi_select: [
              {
                value: 'e5cgnczmfys',
                label: 'Option C',
              },
              {
                value: 'aot0horszdt',
                label: 'Option A',
              },
            ],
          },
          template: '5bfbb1a0471dd0fc16ada146',
          title: 'Document 3',
          creationDate: 1654544068027,
          published: false,
          sharedId: '844ts659a7',
          documents: [],
          attachments: [],
        },
        _id: '62a3459f25e55412954d7763',
        entity: '844ts659a7',
        hub: '62a3459f25e55412954d775a',
      },
      {
        template: null,
        entityData: {
          _id: '62a3459f25e55412954d774b',
          metadata: {
            'multi-inherit_text': [
              {
                value: 'f27fwxhlsqo',
                label: 'Document 1',
                type: 'entity',
                inheritedValue: [
                  {
                    value: 'One',
                  },
                ],
                inheritedType: 'text',
              },
              {
                value: '844ts659a7',
                label: 'Document 3',
                type: 'entity',
                inheritedValue: [
                  {
                    value: 'Three',
                  },
                ],
                inheritedType: 'text',
              },
            ],
            'multi-inherit_number': [
              {
                value: 'f27fwxhlsqo',
                label: 'Document 1',
                type: 'entity',
                inheritedValue: [
                  {
                    value: 1,
                  },
                ],
                inheritedType: 'numeric',
              },
              {
                value: '844ts659a7',
                label: 'Document 3',
                type: 'entity',
                inheritedValue: [
                  {
                    value: 3,
                  },
                ],
                inheritedType: 'numeric',
              },
            ],
            'multi-inherit_geo': [
              {
                value: '3zeqx3aptzi',
                label: 'Peru',
                type: 'entity',
                inheritedValue: [
                  {
                    value: {
                      lat: -10.189511603370525,
                      lon: -74.97070312500001,
                      label: '',
                    },
                  },
                ],
                inheritedType: 'geolocation',
              },
            ],
          },
          template: '62a34533100b901027a250e6',
          title: 'Other iDcoument 1',
          creationDate: 1654867359008,
          published: false,
          sharedId: 'k60i7wxo9vc',
          documents: [],
          attachments: [],
        },
        _id: '62a3459f25e55412954d7761',
        entity: 'k60i7wxo9vc',
        hub: '62a3459f25e55412954d775a',
      },
      {
        template: '629e55f1d4242c571392d5fc',
        entityData: {
          _id: '629e56a1d4242c571392fc07',
          metadata: {
            text: [
              {
                value: 'One',
              },
            ],
            numeric: [
              {
                value: 1,
              },
            ],
            select: [
              {
                value: 'aot0horszdt',
                label: 'Option A',
              },
            ],
            multi_select: [
              {
                value: 'e5cgnczmfys',
                label: 'Option C',
              },
              {
                value: 'aot0horszdt',
                label: 'Option A',
              },
            ],
          },
          template: '5bfbb1a0471dd0fc16ada146',
          title: 'Document 1',
          creationDate: 1654544033340,
          published: false,
          sharedId: 'f27fwxhlsqo',
          documents: [],
          attachments: [],
        },
        _id: '62a3459f25e55412954d7762',
        entity: 'f27fwxhlsqo',
        hub: '62a3459f25e55412954d775a',
      },
      {
        template: '629e55f1d4242c571392d5fc',
        entityData: {
          _id: '629f907f38ef5b334384a919',
          metadata: {
            select: [
              {
                value: '92lfe31qc3n',
                label: 'Option B',
              },
            ],
            geolocation_geolocation: [
              {
                value: {
                  lat: -10.189511603370525,
                  lon: -74.97070312500001,
                  label: '',
                },
              },
            ],
          },
          template: '629f900638ef5b3343848e80',
          title: 'Peru',
          creationDate: 1654624383651,
          published: false,
          sharedId: '3zeqx3aptzi',
          documents: [],
          attachments: [],
        },
        _id: '62a3459f25e55412954d7765',
        entity: '3zeqx3aptzi',
        hub: '62a3459f25e55412954d775c',
      },
      {
        template: null,
        entityData: {
          _id: '62a3459f25e55412954d774b',
          metadata: {
            'multi-inherit_text': [
              {
                value: 'f27fwxhlsqo',
                label: 'Document 1',
                type: 'entity',
                inheritedValue: [
                  {
                    value: 'One',
                  },
                ],
                inheritedType: 'text',
              },
              {
                value: '844ts659a7',
                label: 'Document 3',
                type: 'entity',
                inheritedValue: [
                  {
                    value: 'Three',
                  },
                ],
                inheritedType: 'text',
              },
            ],
            'multi-inherit_number': [
              {
                value: 'f27fwxhlsqo',
                label: 'Document 1',
                type: 'entity',
                inheritedValue: [
                  {
                    value: 1,
                  },
                ],
                inheritedType: 'numeric',
              },
              {
                value: '844ts659a7',
                label: 'Document 3',
                type: 'entity',
                inheritedValue: [
                  {
                    value: 3,
                  },
                ],
                inheritedType: 'numeric',
              },
            ],
            'multi-inherit_geo': [
              {
                value: '3zeqx3aptzi',
                label: 'Peru',
                type: 'entity',
                inheritedValue: [
                  {
                    value: {
                      lat: -10.189511603370525,
                      lon: -74.97070312500001,
                      label: '',
                    },
                  },
                ],
                inheritedType: 'geolocation',
              },
            ],
          },
          template: '62a34533100b901027a250e6',
          title: 'Other iDcoument 1',
          creationDate: 1654867359008,
          published: false,
          sharedId: 'k60i7wxo9vc',
          documents: [],
          attachments: [],
        },
        _id: '62a3459f25e55412954d7764',
        entity: 'k60i7wxo9vc',
        hub: '62a3459f25e55412954d775c',
      },
    ],
    metadata: {
      'multi-inherit_text': [
        {
          value: 'f27fwxhlsqo',
          label: 'Document 1',
          type: 'entity',
          inheritedValue: [
            {
              value: 'One',
            },
          ],
          inheritedType: 'text',
        },
        {
          value: '844ts659a7',
          label: 'Document 3',
          type: 'entity',
          inheritedValue: [
            {
              value: 'Three',
            },
          ],
          inheritedType: 'text',
        },
      ],
      'multi-inherit_number': [
        {
          value: 'f27fwxhlsqo',
          label: 'Document 1',
          type: 'entity',
          inheritedValue: [
            {
              value: 1,
            },
          ],
          inheritedType: 'numeric',
        },
        {
          value: '844ts659a7',
          label: 'Document 3',
          type: 'entity',
          inheritedValue: [
            {
              value: 3,
            },
          ],
          inheritedType: 'numeric',
        },
      ],
      'multi-inherit_geo': [
        {
          value: '3zeqx3aptzi',
          label: 'Peru',
          type: 'entity',
          inheritedValue: [
            {
              value: {
                lat: -10.189511603370525,
                lon: -74.97070312500001,
                label: '',
              },
            },
          ],
          inheritedType: 'geolocation',
        },
      ],
    },
  },
];

const relationTypes = [
  {
    _id: '629e55f1d4242c571392d5fc',
    name: 'Multi-inherit',
  },
  {
    _id: '629e55f8d4242c571392dbf1',
    name: 'Inherit',
  },
  {
    _id: '629e55fed4242c571392e1e8',
    name: 'Related to',
  },
  {
    _id: '629f902238ef5b3343849b62',
    name: 'Multi-inherit-2',
  },
];

const entityData1RelationsAggregations = {
  'Multi-inherit-2-629f900638ef5b3343848e80': [
    {
      title: 'Argentina',
      sharedId: '9e13muy08kl',
      metadata: {
        select: ['Option D 3'],
        geolocation_geolocation: [
          {
            lat: -36.19286487671368,
            lon: -64.29199218750001,
            label: '',
          },
        ],
      },
    },
    {
      title: 'Peru',
      sharedId: '3zeqx3aptzi',
      metadata: {
        select: ['Option B'],
        geolocation_geolocation: [
          {
            lat: -10.189511603370525,
            lon: -74.97070312500001,
            label: '',
          },
        ],
      },
    },
  ],
  'Multi-inherit-5bfbb1a0471dd0fc16ada146': [
    {
      title: 'Document 3',
      sharedId: '844ts659a7',
      metadata: {
        text: ['Three'],
        numeric: [3],
        select: ['Option C'],
      },
    },
    {
      title: 'Document 1',
      sharedId: 'f27fwxhlsqo',
      metadata: {
        text: ['One'],
        numeric: [1],
        select: ['Option A'],
      },
    },
    {
      title: 'Document 2',
      sharedId: 'u4uclgwzcp',
      metadata: {
        text: ['Two'],
        numeric: [2],
        select: ['Option B'],
      },
    },
    {
      title: 'Document 4',
      sharedId: '4qkgragsevq',
      metadata: {
        text: ['Four'],
        numeric: [4],
        select: ['Option D 1'],
      },
    },
  ],
};

const entityData2RelationsAggregations = {
  'Multi-inherit-2-629f900638ef5b3343848e80': [
    {
      title: 'Venezuela',
      sharedId: 'mp9v2ugx1un',
      metadata: {
        select: ['Option D 2'],
        geolocation_geolocation: [
          {
            lat: 7.9243233190236015,
            lon: -65.47851562500001,
            label: '',
          },
        ],
      },
    },
  ],
};

const entityData4RelationsAggregations = {
  'Multi-inherit-5bfbb1a0471dd0fc16ada146': [
    {
      title: 'Document 3',
      sharedId: '844ts659a7',
      metadata: {
        text: ['Three'],
        numeric: [3],
      },
    },
    {
      title: 'Document 1',
      sharedId: 'f27fwxhlsqo',
      metadata: {
        text: ['One'],
        numeric: [1],
      },
    },
  ],
  'Multi-inherit-629f900638ef5b3343848e80': [
    {
      title: 'Peru',
      sharedId: '3zeqx3aptzi',
      metadata: {
        geolocation_geolocation: [{ lat: -10.189511603370525, lon: -74.97070312500001, label: '' }],
      },
    },
  ],
};

export {
  dbTemplates,
  rawEntities,
  thesauris,
  relationTypes,
  entityData1RelationsAggregations,
  entityData2RelationsAggregations,
  entityData4RelationsAggregations,
};
