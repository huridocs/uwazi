/* eslint-disable max-lines */
import Immutable from 'immutable';
import { EntitySchema } from 'shared/types/entityType';
import { IImmutable } from 'shared/types/Immutable';
import { TemplateSchema } from 'shared/types/templateType';

const dbTemplates: IImmutable<TemplateSchema>[] = [
  Immutable.fromJS({
    _id: '5bfbb1a0471dd0fc16ada146',
    name: 'Document',
    commonProperties: [
      {
        _id: '5bfbb1a0471dd0fc16ada148',
        label: 'Title',
        name: 'title',
        isCommonProperty: true,
        type: 'text',
      },
      {
        _id: '5bfbb1a0471dd0fc16ada147',
        label: 'Date added',
        name: 'creationDate',
        isCommonProperty: true,
        type: 'date',
      },
    ],
    properties: [
      {
        _id: '629e5634d4242c571392f43e',
        label: 'Text',
        type: 'text',
        name: 'text',
      },
      {
        _id: '629e5634d4242c571392f43f',
        label: 'Numeric',
        type: 'numeric',
        name: 'numeric',
      },
      {
        _id: '629e5634d4242c571392f440',
        label: 'Select',
        type: 'select',
        content: '629e5625d4242c571392e824',
        name: 'select',
      },
    ],
  }),
  Immutable.fromJS({
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
    ],
    commonProperties: [
      {
        _id: '629e567fd4242c571392f54c',
        label: 'Title',
        name: 'title',
        isCommonProperty: true,
        type: 'text',
      },
      {
        _id: '629e567fd4242c571392f54d',
        label: 'Date added',
        name: 'creationDate',
        isCommonProperty: true,
        type: 'date',
      },
      {
        _id: '629e567fd4242c571392f54e',
        label: 'Date modified',
        name: 'editDate',
        isCommonProperty: true,
        type: 'date',
      },
    ],
    __v: 0,
  }),
];

const dbEntity: EntitySchema = {
  _id: '629e5712d4242c571392fcd4',
  template: '629e567fd4242c571392f548',
  title: 'iDocument 1',
  creationDate: 1654544146164,
  editDate: 1654544146165,
  language: 'en',
  sharedId: 's07ki698a69',
  metadata: {
    itext: [
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
        value: 'f27fwxhlsqo',
        label: 'Document 1',
        type: 'entity',
        inheritedValue: [{ value: 'aot0horszdt', label: 'Option A' }],
        inheritedType: 'select',
      },
      {
        value: '844ts659a7',
        label: 'Document 3',
        type: 'entity',
        inheritedValue: [{ value: 'e5cgnczmfys', label: 'Option C' }],
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
  },
  relations: [
    {
      template: null,
      entityData: {
        _id: '629e5712d4242c571392fcd4',
        metadata: {
          itext: [
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
              value: 'f27fwxhlsqo',
              label: 'Document 1',
              type: 'entity',
              inheritedValue: [{ value: 'aot0horszdt', label: 'Option A' }],
              inheritedType: 'select',
            },
            {
              value: '844ts659a7',
              label: 'Document 3',
              type: 'entity',
              inheritedValue: [{ value: 'e5cgnczmfys', label: 'Option C' }],
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
        },
        template: '629e567fd4242c571392f548',
        title: 'iDocument 1',
        creationDate: 1654544146164,
        sharedId: 's07ki698a69',
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
        sharedId: '844ts659a7',
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
        sharedId: 'f27fwxhlsqo',
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
        sharedId: 'u4uclgwzcp',
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
        sharedId: '4qkgragsevq',
      },
      _id: '629e5712d4242c571392fce6',
      entity: '4qkgragsevq',
      hub: '629e5712d4242c571392fcdd',
    },
  ],
};

const thesauri = Immutable.fromJS([
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
]);

export { dbTemplates, dbEntity, thesauri };
