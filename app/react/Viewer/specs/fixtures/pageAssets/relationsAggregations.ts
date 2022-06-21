/* eslint-disable max-lines */
import Immutable from 'immutable';
import { ClientTemplateSchema } from 'app/istore';
import { EntitySchema } from 'shared/types/entityType';
import { IImmutable } from 'shared/types/Immutable';

const DocumentWithRelationsTemplate = Immutable.fromJS({
  _id: '629e567fd4242c571392f548',
  name: 'Document with relations',
  properties: [
    {
      _id: '629e567fd4242c571392f549',
      label: 'iText',
      type: 'relationship',
      inherit: { property: '629e5634d4242c571392f43e', type: 'text' },
      content: '5bfbb1a0471dd0fc16ada146',
      relationType: '629e55f1d4242c571392d5fc',
      name: 'itext',
    },
    {
      _id: '629e567fd4242c571392f54a',
      label: 'iNumeric',
      type: 'relationship',
      inherit: { property: '629e5634d4242c571392f43f', type: 'numeric' },
      content: '5bfbb1a0471dd0fc16ada146',
      relationType: '629e55f1d4242c571392d5fc',
      name: 'inumeric',
    },
    {
      _id: '629e567fd4242c571392f54b',
      label: 'iSelect',
      type: 'relationship',
      inherit: { property: '629e5634d4242c571392f440', type: 'select' },
      content: '5bfbb1a0471dd0fc16ada146',
      relationType: '629e55f1d4242c571392d5fc',
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
      name: 'igeolocation',
    },
    {
      _id: '629f905738ef5b334384a85d',
      label: 'iSelect-country',
      type: 'relationship',
      inherit: { property: '629f900d38ef5b3343849aeb', type: 'select' },
      content: '629f900638ef5b3343848e80',
      relationType: '629f902238ef5b3343849b62',
      name: 'iselect-country',
    },
  ],
});

const iDocument1Metadata = {
  itext: [
    {
      value: '844ts659a7',
      label: 'Document 3',
      type: 'entity',
      inheritedValue: [{ value: 'Three' }],
      inheritedType: 'text',
    },
    {
      value: 'f27fwxhlsqo',
      label: 'Document 1',
      type: 'entity',
      inheritedValue: [{ value: 'One' }],
      inheritedType: 'text',
    },
    {
      value: 'u4uclgwzcp',
      label: 'Document 2',
      type: 'entity',
      inheritedValue: [{ value: 'Two' }],
      inheritedType: 'text',
    },
    {
      value: '4qkgragsevq',
      label: 'Document 4',
      type: 'entity',
      inheritedValue: [{ value: 'Four' }],
      inheritedType: 'text',
    },
  ],
  inumeric: [
    {
      value: '844ts659a7',
      label: 'Document 3',
      type: 'entity',
      inheritedValue: [{ value: 3 }],
      inheritedType: 'numeric',
    },
    {
      value: 'f27fwxhlsqo',
      label: 'Document 1',
      type: 'entity',
      inheritedValue: [{ value: 1 }],
      inheritedType: 'numeric',
    },
    {
      value: 'u4uclgwzcp',
      label: 'Document 2',
      type: 'entity',
      inheritedValue: [{ value: 2 }],
      inheritedType: 'numeric',
    },
    {
      value: '4qkgragsevq',
      label: 'Document 4',
      type: 'entity',
      inheritedValue: [{ value: 4 }],
      inheritedType: 'numeric',
    },
  ],
  iselect: [
    {
      value: '844ts659a7',
      label: 'Document 3',
      type: 'entity',
      inheritedValue: [{ value: 'e5cgnczmfys', label: 'Option C' }],
      inheritedType: 'select',
    },
    {
      value: 'f27fwxhlsqo',
      label: 'Document 1',
      type: 'entity',
      inheritedValue: [{ value: 'aot0horszdt', label: 'Option A' }],
      inheritedType: 'select',
    },
    {
      value: 'u4uclgwzcp',
      label: 'Document 2',
      type: 'entity',
      inheritedValue: [{ value: '92lfe31qc3n', label: 'Option B' }],
      inheritedType: 'select',
    },
    {
      value: '4qkgragsevq',
      label: 'Document 4',
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
      type: 'entity',
      inheritedValue: [{ value: '92lfe31qc3n', label: 'Option B' }],
      inheritedType: 'select',
    },
  ],
  igeolocation: [
    {
      value: '9e13muy08kl',
      label: 'Argentina',
      type: 'entity',
      inheritedValue: [{ value: { lat: -36.19286487671368, lon: -64.29199218750001, label: '' } }],
      inheritedType: 'geolocation',
    },
    {
      value: '3zeqx3aptzi',
      label: 'Peru',
      type: 'entity',
      inheritedValue: [{ value: { lat: -10.189511603370525, lon: -74.97070312500001, label: '' } }],
      inheritedType: 'geolocation',
    },
  ],
};

const iDocument1EntityData = {
  _id: '629e5712d4242c571392fcd4',
  metadata: iDocument1Metadata,
  template: '629e567fd4242c571392f548',
  title: 'iDocument 1',
  creationDate: 1654544146164,
  sharedId: 's07ki698a69',
};

const OtherDocumentWithRelations = Immutable.fromJS({
  _id: '62a34533100b901027a250e6',
  name: 'Other document with relations',
  properties: [
    {
      _id: '62a34533100b901027a250e7',
      label: 'Multi-inherit text',
      type: 'relationship',
      inherit: { property: '629e5634d4242c571392f43e', type: 'text' },
      content: '5bfbb1a0471dd0fc16ada146',
      relationType: '629e55f1d4242c571392d5fc',
      name: 'multi-inherit_text',
    },
    {
      _id: '62a34533100b901027a250e8',
      label: 'Multi-inherit number',
      type: 'relationship',
      inherit: { property: '629e5634d4242c571392f43f', type: 'numeric' },
      content: '5bfbb1a0471dd0fc16ada146',
      relationType: '629e55f1d4242c571392d5fc',
      name: 'multi-inherit_number',
    },
    {
      _id: '62a34533100b901027a250e9',
      label: 'Multi-inherit geo',
      type: 'relationship',
      inherit: { property: '629f900638ef5b3343848e81', type: 'geolocation' },
      content: '629f900638ef5b3343848e80',
      relationType: '629e55f1d4242c571392d5fc',
      name: 'multi-inherit_geo',
    },
    { _id: '62a34533100b901027a65bh4', label: 'Plaintext', type: 'text', name: 'plaintext' },
  ],
});

const myTemplate = Immutable.fromJS({
  _id: '62ab63ce9480d0a7ebb32f41',
  name: 'My template',
  properties: [
    {
      _id: '62ab64039480d0a7ebb34df5',
      label: 'Inhertied text from Template A',
      type: 'relationship',
      inherit: { property: '62ab58c7edafa48e2c771ec8', type: 'text' },
      content: '62ab58c7edafa48e2c771ec7',
      relationType: '62ab58bdedafa48e2c7718c3',
      name: 'inhertied_text_from_template_a',
    },
    {
      _id: '62ab64039480d0a7ebb34df6',
      label: 'Inhertied number from Template B',
      type: 'relationship',
      inherit: { property: '62ab58cfedafa48e2c7724ee', type: 'numeric' },
      content: '62ab58cfedafa48e2c7724ec',
      relationType: '62ab58bdedafa48e2c7718c3',
      name: 'inhertied_number_from_template_b',
    },
  ],
});

const templatesForAggregations: IImmutable<ClientTemplateSchema[]> = Immutable.fromJS([
  DocumentWithRelationsTemplate,
  OtherDocumentWithRelations,
  myTemplate,
  {
    _id: '5bfbb1a0471dd0fc16ada146',
    name: 'Document',
    properties: [
      { _id: '629e5634d4242c571392f43e', label: 'Text', type: 'text', name: 'text' },
      { _id: '629e5634d4242c571392f43f', label: 'Numeric', type: 'numeric', name: 'numeric' },
      {
        _id: '629e5634d4242c571392f440',
        label: 'Select',
        type: 'select',
        content: '629e5625d4242c571392e824',
        name: 'select',
      },
    ],
  },
  {
    _id: '629f900638ef5b3343848e80',
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
  },
  {
    _id: '62ab58c7edafa48e2c771ec7',
    name: 'Template A',
    properties: [
      { _id: '62ab58c7edafa48e2c771ec8', label: 'Text', type: 'text', name: 'text' },
      { _id: '62ab58c7edafa48e2c771ec9', label: 'Numeric', type: 'numeric', name: 'numeric' },
    ],
  },
  {
    _id: '62ab58cfedafa48e2c7724ec',
    name: 'Template B',
    properties: [
      { _id: '62ab58cfedafa48e2c7724ed', label: 'Text', type: 'text', name: 'text' },
      { _id: '62ab58cfedafa48e2c7724ee', label: 'Numeric', type: 'numeric', name: 'numeric' },
    ],
  },
  {
    _id: '62ab60ea1bf79aa526174311',
    name: 'Template C',
    properties: [{ _id: '62ab60ea1bf79aa526174312', label: 'Date', type: 'date', name: 'date' }],
  },
  {
    _id: '62ab624d1bf79aa5261750a5',
    name: 'Template D',
    properties: [
      {
        _id: '62ab641e9480d0a7ebb3550a',
        label: 'Inheriting from My template',
        type: 'relationship',
        inherit: { property: '62ab64039480d0a7ebb34df5', type: 'relationship' },
        content: '62ab63ce9480d0a7ebb32f41',
        relationType: '62ab58bdedafa48e2c7718c3',
        name: 'inheriting_from_my_template',
      },
    ],
  },
]);

const thesaurisForAggregations = Immutable.fromJS([
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
    values: [
      { id: 'f27fwxhlsqo', label: 'Document 1' },
      { id: 'u4uclgwzcp', label: 'Document 2' },
      { id: '844ts659a7', label: 'Document 3' },
      { id: '4qkgragsevq', label: 'Document 4' },
    ],
    name: 'Document',
    properties: [
      { _id: '629e5634d4242c571392f43e', label: 'Text', type: 'text', name: 'text' },
      { _id: '629e5634d4242c571392f43f', label: 'Numeric', type: 'numeric', name: 'numeric' },
      {
        _id: '629e5634d4242c571392f440',
        label: 'Select',
        type: 'select',
        content: '629e5625d4242c571392e824',
        name: 'select',
      },
    ],
    _id: '5bfbb1a0471dd0fc16ada146',
    type: 'template',
  },
  {
    values: [
      { id: 's07ki698a69', label: 'iDocument 1' },
      { id: 'ayvlz9vy4vq', label: 'iDocument 2' },
    ],
    ...DocumentWithRelationsTemplate,
    type: 'template',
  },
  {
    values: [
      { id: '9e13muy08kl', label: 'Argentina' },
      { id: '3zeqx3aptzi', label: 'Peru' },
      { id: 'ckww13sin9', label: 'Bolivia' },
      { id: 'mp9v2ugx1un', label: 'Venezuela' },
    ],
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
    _id: '629f900638ef5b3343848e80',
    type: 'template',
  },
]);

const relationTypes = [
  { _id: '629e55f1d4242c571392d5fc', name: 'Multi-inherit' },
  { _id: '629e55f8d4242c571392dbf1', name: 'Inherit' },
  { _id: '629e55fed4242c571392e1e8', name: 'Related to' },
  { _id: '629f902238ef5b3343849b62', name: 'Multi-inherit-2' },
  { _id: '62ab58bdedafa48e2c7718c3', name: 'Inheriting' },
  { _id: '62ace3f4d0a3915cd7e6d4c3', name: 'Friend' },
];

const entityData1RelationsAggregations = {
  'Multi-inherit-2-629f900638ef5b3343848e80': [
    {
      title: 'Argentina',
      sharedId: '9e13muy08kl',
      metadata: {
        select: ['Option D 3'],
        geolocation_geolocation: [{ lat: -36.19286487671368, lon: -64.29199218750001, label: '' }],
      },
    },
    {
      title: 'Peru',
      sharedId: '3zeqx3aptzi',
      metadata: {
        select: ['Option B'],
        geolocation_geolocation: [{ lat: -10.189511603370525, lon: -74.97070312500001, label: '' }],
      },
    },
  ],
  'Multi-inherit-5bfbb1a0471dd0fc16ada146': [
    {
      title: 'Document 3',
      sharedId: '844ts659a7',
      metadata: { text: ['Three'], numeric: [3], select: ['Option C'] },
    },
    {
      title: 'Document 1',
      sharedId: 'f27fwxhlsqo',
      metadata: { text: ['One'], numeric: [1], select: ['Option A'] },
    },
    {
      title: 'Document 2',
      sharedId: 'u4uclgwzcp',
      metadata: { text: ['Two'], numeric: [2], select: ['Option B'] },
    },
    {
      title: 'Document 4',
      sharedId: '4qkgragsevq',
      metadata: { text: ['Four'], numeric: [4], select: ['Option D 1'] },
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
        geolocation_geolocation: [{ lat: 7.9243233190236015, lon: -65.47851562500001, label: '' }],
      },
    },
  ],
};

const entityData4RelationsAggregations = {
  'Multi-inherit-5bfbb1a0471dd0fc16ada146': [
    { title: 'Document 3', sharedId: '844ts659a7', metadata: { text: ['Three'], numeric: [3] } },
    { title: 'Document 1', sharedId: 'f27fwxhlsqo', metadata: { text: ['One'], numeric: [1] } },
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

const entityData5RelationsAggregations = {
  'Inheriting-62ab58c7edafa48e2c771ec7': [
    { title: 'A1', sharedId: 'n6a1ulcmwa', metadata: { text: ['A'] } },
  ],
  'Inheriting-62ab58cfedafa48e2c7724ec': [
    { title: 'B1', sharedId: 'rnid5ejh3vd', metadata: { numeric: [10] } },
  ],
};

const document1Entity = {
  _id: '629e56a1d4242c571392fc07',
  metadata: {
    text: [{ value: 'One' }],
    multi_select: [
      { value: 'e5cgnczmfys', label: 'Option C' },
      { value: 'aot0horszdt', label: 'Option A' },
    ],
    numeric: [{ value: 1 }],
    select: [{ value: 'aot0horszdt', label: 'Option A' }],
  },
  template: '5bfbb1a0471dd0fc16ada146',
  title: 'Document 1',
  sharedId: 'f27fwxhlsqo',
};

const document2Entity = {
  _id: '629e56aed4242c571392fc3f',
  metadata: {
    text: [{ value: 'Two' }],
    numeric: [{ value: 2 }],
    select: [{ value: '92lfe31qc3n', label: 'Option B' }],
  },
  template: '5bfbb1a0471dd0fc16ada146',
  title: 'Document 2',
  sharedId: 'u4uclgwzcp',
};

const document3Entity = {
  _id: '629e56c4d4242c571392fc6d',
  template: '5bfbb1a0471dd0fc16ada146',
  title: 'Document 3',
  sharedId: '844ts659a7',
  metadata: {
    text: [{ value: 'Three' }],
    numeric: [{ value: 3 }],
    select: [{ value: 'e5cgnczmfys', label: 'Option C' }],
    multi_select: [
      { value: 'e5cgnczmfys', label: 'Option C' },
      { value: 'aot0horszdt', label: 'Option A' },
    ],
  },
};

const iDocument2Entity = {
  _id: '629f8ec82157cf2c185e0bf1',
  metadata: {
    'iselect-country': [
      {
        value: 'mp9v2ugx1un',
        label: 'Venezuela',
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
  sharedId: 'ayvlz9vy4vq',
};

const peruEntity = {
  _id: '629f907f38ef5b334384a919',
  metadata: {
    select: [{ value: '92lfe31qc3n', label: 'Option B' }],
    geolocation_geolocation: [
      { value: { lat: -10.189511603370525, lon: -74.97070312500001, label: '' } },
    ],
  },
  template: '629f900638ef5b3343848e80',
  title: 'Peru',
  sharedId: '3zeqx3aptzi',
};

const otherEntities: EntitySchema[] = [
  {
    _id: '629e5712d4242c571392fcd4',
    template: '629e567fd4242c571392f548',
    title: 'iDocument 1',
    sharedId: 's07ki698a69',
    metadata: iDocument1Metadata,
    relations: [
      {
        template: null,
        entityData: iDocument1EntityData,
        _id: '629e5712d4242c571392fce2',
        entity: 's07ki698a69',
        hub: '629e5712d4242c571392fcdd',
      },
      {
        template: '629e55f1d4242c571392d5fc',
        entityData: document3Entity,
        _id: '629e5712d4242c571392fce4',
        entity: '844ts659a7',
        hub: '629e5712d4242c571392fcdd',
      },
      {
        template: '629e55f1d4242c571392d5fc',
        entityData: document1Entity,
        _id: '629e5712d4242c571392fce3',
        entity: 'f27fwxhlsqo',
        hub: '629e5712d4242c571392fcdd',
      },
      {
        template: '629e55f1d4242c571392d5fc',
        entityData: document2Entity,
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
          sharedId: '4qkgragsevq',
        },
        _id: '629e5712d4242c571392fce6',
        entity: '4qkgragsevq',
        hub: '629e5712d4242c571392fcdd',
      },
      {
        template: null,
        entityData: iDocument1EntityData,
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
          sharedId: '9e13muy08kl',
        },
        _id: '629f90b438ef5b334384a9ea',
        entity: '9e13muy08kl',
        hub: '629f90b438ef5b334384a9e4',
      },
      {
        template: '629f902238ef5b3343849b62',
        entityData: peruEntity,
        _id: '629f90b438ef5b334384a9eb',
        entity: '3zeqx3aptzi',
        hub: '629f90b438ef5b334384a9e4',
      },
    ],
  },
  {
    ...iDocument2Entity,
    relations: [
      {
        template: null,
        entityData: iDocument2Entity,
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
          sharedId: 'mp9v2ugx1un',
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
    sharedId: '6vad5znb6c',
    metadata: {
      itext: [],
      inumeric: [],
      iselect: [],
      description: [{ value: 'Just some text' }],
      igeolocation: [],
      'iselect-country': [],
    },
  },
];

const inheritingDocumentMetadata = {
  'multi-inherit_text': [
    {
      value: 'f27fwxhlsqo',
      label: 'Document 1',
      type: 'entity',
      inheritedValue: [{ value: 'One' }],
      inheritedType: 'text',
    },
    {
      value: '844ts659a7',
      label: 'Document 3',
      type: 'entity',
      inheritedValue: [{ value: 'Three' }],
      inheritedType: 'text',
    },
  ],
  'multi-inherit_number': [
    {
      value: 'f27fwxhlsqo',
      label: 'Document 1',
      type: 'entity',
      inheritedValue: [{ value: 1 }],
      inheritedType: 'numeric',
    },
    {
      value: '844ts659a7',
      label: 'Document 3',
      type: 'entity',
      inheritedValue: [{ value: 3 }],
      inheritedType: 'numeric',
    },
  ],
  'multi-inherit_geo': [
    {
      value: '3zeqx3aptzi',
      label: 'Peru',
      type: 'entity',
      inheritedValue: [{ value: { lat: -10.189511603370525, lon: -74.97070312500001, label: '' } }],
      inheritedType: 'geolocation',
    },
  ],
  plaintext: [{ value: 'Some long text' }],
};

const inheritingDocument: EntitySchema = {
  _id: '62a3459f25e55412954d774b',
  template: '62a34533100b901027a250e6',
  title: 'Other iDcoument 1',
  sharedId: 'k60i7wxo9vc',
  relations: [
    {
      template: '629e55f1d4242c571392d5fc',
      entityData: document3Entity,
      _id: '62a3459f25e55412954d7763',
      entity: '844ts659a7',
      hub: '62a3459f25e55412954d775a',
    },
    {
      template: null,
      entityData: {
        _id: '62a3459f25e55412954d774b',
        metadata: inheritingDocumentMetadata,
        template: '62a34533100b901027a250e6',
        title: 'Other iDcoument 1',
        sharedId: 'k60i7wxo9vc',
      },
      _id: '62a3459f25e55412954d7761',
      entity: 'k60i7wxo9vc',
      hub: '62a3459f25e55412954d775a',
    },
    {
      template: '629e55f1d4242c571392d5fc',
      entityData: document1Entity,
      _id: '62a3459f25e55412954d7762',
      entity: 'f27fwxhlsqo',
      hub: '62a3459f25e55412954d775a',
    },
    {
      template: '629e55f1d4242c571392d5fc',
      entityData: peruEntity,
      _id: '62a3459f25e55412954d7765',
      entity: '3zeqx3aptzi',
      hub: '62a3459f25e55412954d775c',
    },
    {
      template: null,
      entityData: {
        _id: '62a3459f25e55412954d774b',
        metadata: inheritingDocumentMetadata,
        template: '62a34533100b901027a250e6',
        title: 'Other iDcoument 1',
        sharedId: 'k60i7wxo9vc',
      },
      _id: '62a3459f25e55412954d7764',
      entity: 'k60i7wxo9vc',
      hub: '62a3459f25e55412954d775c',
    },
  ],
  metadata: inheritingDocumentMetadata,
};

const myEntityMetadata = {
  inhertied_text_from_template_a: [
    {
      value: 'n6a1ulcmwa',
      label: 'A1',
      type: 'entity',
      inheritedValue: [{ value: 'A' }],
      inheritedType: 'text',
    },
  ],
  inhertied_number_from_template_b: [
    {
      value: 'rnid5ejh3vd',
      label: 'B1',
      type: 'entity',
      inheritedValue: [{ value: 10 }],
      inheritedType: 'numeric',
    },
  ],
};

const myEntity1Entity = {
  _id: '62ab642b9480d0a7ebb35546',
  metadata: myEntityMetadata,
  template: '62ab63ce9480d0a7ebb32f41',
  title: 'My entity 1',
  sharedId: 'fewuvrs4xo',
};

const myEntity: EntitySchema = {
  ...myEntity1Entity,
  relations: [
    myEntity1Entity,
    {
      template: '62ab58bdedafa48e2c7718c3',
      entityData: {
        _id: '62ab5908edafa48e2c7731a7',
        metadata: { text: [{ value: 'A' }], numeric: [{ value: 1 }] },
        template: '62ab58c7edafa48e2c771ec7',
        title: 'A1',
        sharedId: 'n6a1ulcmwa',
      },
      _id: '62ab642b9480d0a7ebb35559',
      entity: 'n6a1ulcmwa',
      hub: '62ab642b9480d0a7ebb35551',
    },
    {
      template: null,
      entityData: myEntity1Entity,
      _id: '62ab642b9480d0a7ebb3555a',
      entity: 'fewuvrs4xo',
      hub: '62ab642b9480d0a7ebb35553',
    },
    {
      template: '62ab58bdedafa48e2c7718c3',
      entityData: {
        _id: '62ab5918edafa48e2c773205',
        metadata: { text: [{ value: 'B' }], numeric: [{ value: 10 }] },
        template: '62ab58cfedafa48e2c7724ec',
        title: 'B1',
        sharedId: 'rnid5ejh3vd',
      },
      _id: '62ab642b9480d0a7ebb3555b',
      entity: 'rnid5ejh3vd',
      hub: '62ab642b9480d0a7ebb35553',
    },
    {
      template: null,
      entityData: myEntity1Entity,
      _id: '62ab643e9480d0a7ebb355b6',
      entity: 'fewuvrs4xo',
      hub: '62ab643e9480d0a7ebb355b3',
    },
    {
      template: '62ab58bdedafa48e2c7718c3',
      entityData: {
        _id: '62ab61d81bf79aa526174e56',
        metadata: { date: [{ value: 1654041600 }] },
        template: '62ab60ea1bf79aa526174311',
        title: 'C1',
        sharedId: '6liuhix9td',
      },
      _id: '62ab643e9480d0a7ebb355b7',
      entity: '6liuhix9td',
      hub: '62ab643e9480d0a7ebb355b3',
    },
    {
      template: null,
      entityData: {
        _id: '62ab644c9480d0a7ebb35623',
        metadata: {
          inheriting_from_my_template: [
            {
              value: 'fewuvrs4xo',
              label: 'My entity 1',
              type: 'entity',
              inheritedValue: [
                {
                  value: 'n6a1ulcmwa',
                  label: 'A1',
                  type: 'entity',
                  inheritedValue: [{ value: 'A' }],
                  inheritedType: 'text',
                },
              ],
              inheritedType: 'relationship',
            },
          ],
        },
        template: '62ab624d1bf79aa5261750a5',
        title: 'D1',
        sharedId: 'vh3rrsrqq1g',
      },
      _id: '62ab644c9480d0a7ebb35633',
      entity: 'vh3rrsrqq1g',
      hub: '62ab644c9480d0a7ebb3562e',
    },
    {
      template: '62ab58bdedafa48e2c7718c3',
      entityData: myEntity1Entity,
      _id: '62ab644c9480d0a7ebb35634',
      entity: 'fewuvrs4xo',
      hub: '62ab644c9480d0a7ebb3562e',
    },
    {
      _id: '62ace86ad0a3915cd7e6dafe',
      template: '62ace3f4d0a3915cd7e6d4c3',
      entityData: {
        _id: '62ab8fff53c83535c3312e88',
        metadata: { text: [{ value: 'A1_1' }], numeric: [{ value: 100 }] },
        template: '62ab58c7edafa48e2c771ec7',
        title: 'A1_1',
        sharedId: '5vburd9y3ba',
      },
      entity: '5vburd9y3ba',
      hub: '62ab8fb653c83535c3312ad8',
    },
  ],
};

export {
  templatesForAggregations,
  thesaurisForAggregations,
  otherEntities,
  relationTypes,
  entityData1RelationsAggregations,
  entityData2RelationsAggregations,
  entityData4RelationsAggregations,
  entityData5RelationsAggregations,
  DocumentWithRelationsTemplate,
  OtherDocumentWithRelations,
  myTemplate,
  inheritingDocument,
  myEntity,
};
