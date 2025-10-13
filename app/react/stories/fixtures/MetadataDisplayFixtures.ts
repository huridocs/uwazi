/* eslint-disable max-lines */
import { ProcessingContext } from 'V2/application/services/processors/types';
import { EntitySchema } from 'shared/types/entityType';

const rawEntity: EntitySchema = {
  _id: '1',
  language: 'en',
  mongoLanguage: 'en',
  sharedId: 'shared1',
  title: 'Sample entity',
  template: '1',
  creationDate: 1759374706197,
  editDate: 1760366924144,
  metadata: {
    text_label: [
      {
        value: 'Some simple text',
      },
    ],
    markdown_html: [
      {
        value:
          '<p>This <b>Markdown</b> field includes <i>simple HTML</i> tags and a <a href="https://example.com">link</a>.</p>',
      },
    ],
    markdown_markdown: [
      {
        value: '**Bold text**, *italic text*, and a [link](https://example.com)',
      },
    ],
    date: [
      {
        value: 1759363200,
      },
    ],
    geolocationisolated_geolocation: [
      {
        value: {
          lat: 46.3964365565104,
          lon: 3.6694335937500004,
          label: '',
        },
      },
    ],
    multidate: [
      {
        value: 1759276800,
      },
      {
        value: 1759363200,
      },
      {
        value: 1759449600,
      },
    ],
    daterange: [
      {
        value: {
          from: 1759276800,
          to: 1761955199,
        },
      },
    ],
    multidaterange: [
      {
        value: {
          from: 1759276800,
          to: 1759449599,
        },
      },
      {
        value: {
          from: 1759363200,
          to: 1759535999,
        },
      },
    ],
    select: [
      {
        value: '9e22a1af-75d7-49a2-b9d8-9ec77939b630',
        label: 'Again',
      },
    ],
    multiselect: [
      {
        value: '765ab6ca-56a1-4948-9dc9-17fc0aa30843',
        label: 'Acknowledging',
      },
      {
        value: '9e22a1af-75d7-49a2-b9d8-9ec77939b630',
        label: 'Again',
      },
      {
        value: '8c418311-1244-4777-800a-65729b8c17a8',
        label: 'verb2',
        parent: {
          value: '68979984-35ac-4b98-abf9-28eac857749c',
          label: 'grouped',
        },
      },
      {
        value: 'e1b9944b-43ef-4989-837b-b3df79284b00',
        label: 'verb1',
        parent: {
          value: '68979984-35ac-4b98-abf9-28eac857749c',
          label: 'grouped',
        },
      },
    ],
    relationship: [
      {
        value: 'xjku67dv7b',
        label: 'Context trimming sample2',
        icon: {
          _id: 'ECU',
          label: 'Ecuador',
          type: 'Flags',
        },
        type: 'entity',
        inheritedValue: [
          {
            value: '9e22a1af-75d7-49a2-b9d8-9ec77939b630',
            label: 'Again',
          },
          {
            value: '765ab6ca-56a1-4948-9dc9-17fc0aa30843',
            label: 'Acknowledging',
          },
        ],
        inheritedType: 'multiselect',
      },
      {
        value: '4oklamamet',
        label: 'Context trimming sample3',
        icon: '',
        type: 'entity',
        inheritedValue: [],
        inheritedType: 'multiselect',
      },
    ],
    relationship1: [
      {
        value: 'xjku67dv7b',
        label: 'Context trimming sample2',
        icon: {
          _id: 'ECU',
          label: 'Ecuador',
          type: 'Flags',
        },
        type: 'entity',
      },
      {
        value: '4oklamamet',
        label: 'Context trimming sample3',
        icon: '',
        type: 'entity',
      },
    ],
    link: [
      {
        value: {
          label: 'google',
          url: 'www.google.com',
        },
      },
    ],
    image: [
      {
        value: '/api/files/17593747059321ygqk22fdos.png',
      },
    ],
    preview: [
      {
        value: '',
      },
    ],
    media: [
      {
        value:
          '(/api/files/1759374705932xi5rx0mumef.mp4, {"timelinks":{"00:20:15":"control","01:30:45":"Test timelink"}})',
      },
    ],
    geolocation_geolocation: [
      {
        value: {
          lat: 44.33301685687683,
          lon: 5.998535156250001,
          label: '',
        },
      },
    ],
    geolocation2_geolocation: [
      {
        value: {
          lat: 62.58069554111894,
          lon: 15.468750000000002,
          label: '',
        },
      },
    ],
    geolocationr: [
      {
        value: 'xjku67dv7b',
        label: 'Context trimming sample2',
        icon: {
          _id: 'ECU',
          label: 'Ecuador',
          type: 'Flags',
        },
        type: 'entity',
        inheritedValue: [
          {
            value: {
              lat: 43.80157978110818,
              lon: 7.492675781250001,
              label: '',
            },
          },
        ],
        inheritedType: 'geolocation',
      },
      {
        value: '4oklamamet',
        label: 'Context trimming sample3',
        icon: '',
        type: 'entity',
        inheritedValue: [],
        inheritedType: 'geolocation',
      },
    ],
    generatedid: [
      {
        value: 'BDZ3505-3650',
      },
    ],
    'relationship_n-3': [
      {
        value: '6qdshinfobf',
        label: 'Middle1',
        icon: '',
        type: 'entity',
        inheritedValue: [
          {
            value: '7jdr88mnow6',
            label: 'EL1',
            icon: '',
            type: 'entity',
            inheritedValue: [
              {
                value: 'xjku67dv7b',
                label: 'Context trimming sample2',
                icon: {
                  _id: 'ECU',
                  label: 'Ecuador',
                  type: 'Flags',
                },
                type: 'entity',
                inheritedValue: [
                  {
                    value: '9e22a1af-75d7-49a2-b9d8-9ec77939b630',
                    label: 'Again',
                  },
                  {
                    value: '765ab6ca-56a1-4948-9dc9-17fc0aa30843',
                    label: 'Acknowledging',
                  },
                ],
                inheritedType: 'multiselect',
              },
            ],
            inheritedType: 'relationship',
          },
        ],
        inheritedType: 'relationship',
      },
    ],
  },
  user: '58ada34d299e82674854510f',
  permissions: [
    {
      refId: '58ada34d299e82674854510f',
      type: 'user',
      level: 'write',
    },
  ],
  obsoleteMetadata: [],
};

const processingContext: ProcessingContext = {
  includeTemplate: true,
  includeMetadata: true,
  includeRelationships: false,
  includeFiles: false,
  includeNavigation: false,
  includePermissions: true,
  onlyForCards: true,
  dateFormat: 'MMM D, YYYY',
  translateLabels: true,
  language: 'en',
  templates: [
    {
      _id: '1',
      name: 'template1',
      label: 'Template 1',
      color: '#f3c57a',
      commonProperties: [
        {
          _id: '11',
          label: 'Title',
          name: 'title',
          isCommonProperty: true,
          type: 'text',
        },
        {
          _id: '12',
          label: 'Date added',
          name: 'creationDate',
          isCommonProperty: true,
          type: 'date',
        },
        {
          _id: '13',
          label: 'Date modified',
          name: 'editDate',
          type: 'date',
        },
      ],
    },
  ],
};

export { rawEntity, processingContext };
