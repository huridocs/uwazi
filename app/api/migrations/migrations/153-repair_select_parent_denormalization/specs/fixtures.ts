import { ObjectId } from 'mongodb';
import { Fixture } from '../types';

const ids: { [key: string]: ObjectId } = {
  dict: new ObjectId(),
  selectProp: new ObjectId(),
  multiselectProp: new ObjectId(),
  reltype: new ObjectId(),
};

const fixtures: Fixture = {
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
  relationtypes: [
    {
      _id: ids.reltype,
      name: 'relationtype',
    },
  ],
  templates: [
    {
      name: 'with_selects',
      properties: [
        {
          _id: ids.selectProp,
          content: ids.dict.toString(),
          label: 'Select',
          type: 'select',
          name: 'select',
        },
        {
          _id: ids.multiselectProp,
          content: ids.dict.toString(),
          label: 'Multiselect',
          type: 'multiselect',
          name: 'multiselect',
        },
      ],
    },
    {
      name: 'with_inherited_selects',
      properties: [
        {
          content: ids.dict.toString(),
          label: 'inherited_select',
          type: 'relationship',
          inherit: {
            property: ids.selectProp.toString(),
            type: 'select',
          },
          relationType: ids.reltype.toString(),
          name: 'inherited_select',
        },
        {
          content: ids.dict.toString(),
          label: 'inherited_multiselect',
          type: 'relationship',
          inherit: {
            property: ids.multiselectProp.toString(),
            type: 'multiselect',
          },
          relationType: ids.reltype.toString(),
          name: 'inherited_multiselect',
        },
      ],
    },
  ],
};

export { fixtures };
