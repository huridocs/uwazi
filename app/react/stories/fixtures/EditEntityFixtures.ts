/* eslint-disable max-lines */
import { ClientThesaurus, Template } from '#app/apiResponseTypes.js';
import { Entity } from '#V2/api/entities/types.js';

const thesauri: ClientThesaurus[] = [
  {
    _id: 'thes1',
    name: 'Verbs',
    values: [
      {
        label: 'Acknowledging',
        id: 'thes1.1',
      },
      {
        label: 'Again',
        id: 'thes1.2',
      },
      {
        label: 'Confirming',
        id: 'thes1.3',
      },
      {
        label: 'Expressing',
        id: 'thes1.4',
      },
      {
        label: 'Grouped verbs',
        id: 'thes.g',
        values: [
          {
            label: 'verb1',
            id: 'thes.g.1',
          },
          {
            label: 'verb2',
            id: 'thes1.g.2',
          },
        ],
      },
    ],
  },
  {
    _id: 'thes2',
    name: 'Event',
    values: [
      {
        label: 'First event',
        id: 'thes2.1',
      },
      {
        label: 'Second event',
        id: 'thes2.2',
      },
      {
        label: 'Third event',
        id: 'thes2.3',
      },
    ],
  },
];

const templates: Template[] = [
  {
    _id: 'template1',
    name: 'Documents',
    color: '#C03B22',
    properties: [
      {
        _id: '1.1',
        type: 'text',
        label: 'A basic simple text',
        noLabel: false,
        name: 'simple_text',
      },
      {
        _id: '1.3',
        type: 'date',
        label: 'Single Date',
        noLabel: false,
        name: 'single_date',
      },
      {
        _id: '1.4',
        type: 'multidate',
        label: 'Multiple single dates',
        noLabel: false,
        name: 'multiple_dates',
      },
      {
        _id: '1.5',
        type: 'daterange',
        label: 'Single range date',
        noLabel: false,
        name: 'date_range',
      },
      {
        _id: '1.6',
        type: 'multidaterange',
        label: 'Multiple ranges of dates',
        noLabel: false,
        name: 'multiple_date_ranges',
      },
      {
        _id: '1.7',
        content: 'thes2',
        type: 'select',
        label: 'Single select',
        noLabel: false,
        name: 'status_selection',
      },
      {
        _id: '1.8',
        content: 'thes1',
        type: 'multiselect',
        label: 'Multiple selector',
        noLabel: false,
        name: 'category_tags',
      },
      {
        _id: '1.9',
        content: 'template2',
        type: 'relationship',
        label: 'Related people',
        noLabel: false,
        relationType: 'rel1',
        name: 'related_people',
      },
      {
        _id: '1.10',
        type: 'link',
        label: 'External link',
        noLabel: false,
        name: 'external_link',
      },
      {
        _id: '1.11',
        type: 'geolocation',
        label: 'Location on map',
        noLabel: false,
        name: 'location_on_map',
      },
      {
        _id: '1.12',
        type: 'image',
        label: 'Media with an image',
        noLabel: false,
        style: 'fill',
        name: 'selected_image',
      },
      {
        _id: '1.13',
        type: 'media',
        label: 'Media video with timelinks',
        noLabel: false,
        name: 'video_of_event',
      },
      {
        _id: '1.16',
        type: 'preview',
        label: 'Document preview',
        noLabel: false,
        name: 'preview_document',
      },
      {
        _id: '1.14',
        type: 'numeric',
        label: 'Numeric property',
        noLabel: false,
        name: 'numeric_property',
      },
      {
        _id: '1.15',
        type: 'markdown',
        label: 'Markdown field',
        noLabel: false,
        name: 'rich_text_field',
      },
    ],
    commonProperties: [
      {
        _id: '1.title',
        label: 'Title',
        name: 'title',
        type: 'text',
        isCommonProperty: true,
      },
      {
        _id: '1.creationDate',
        label: 'Date added',
        name: 'creationDate',
        type: 'date',
        isCommonProperty: true,
      },
      {
        _id: '1.editDate',
        label: 'Date modified',
        name: 'editDate',
        type: 'date',
        isCommonProperty: true,
      },
    ],
  },
  {
    _id: 'template2',
    name: 'Event Report',
    color: '#AF4323',
    commonProperties: [
      {
        _id: '2.1',
        label: 'Title',
        name: 'title',
        isCommonProperty: true,
        type: 'text',
      },
      {
        _id: '2.2',
        label: 'Date added',
        name: 'creationDate',
        isCommonProperty: true,
        type: 'date',
        prioritySorting: false,
      },
      {
        _id: '2.3',
        label: 'Date modified',
        name: 'editDate',
        type: 'date',
        isCommonProperty: true,
      },
    ],
    properties: [
      {
        _id: '2.1',
        type: 'markdown',
        label: 'Report',
        noLabel: false,
        name: 'report',
      },
    ],
  },
  {
    _id: 'template3',
    name: 'Geolocated data',
    color: '10FF65',
    commonProperties: [
      {
        _id: '3.1',
        label: 'Title',
        name: 'title',
        isCommonProperty: true,
        type: 'text',
      },
      {
        _id: '3.2',
        label: 'Date added',
        name: 'creationDate',
        isCommonProperty: true,
        type: 'date',
        prioritySorting: false,
      },
      {
        _id: '3.3',
        label: 'Date modified',
        name: 'editDate',
        type: 'date',
        isCommonProperty: true,
      },
    ],
    properties: [
      {
        _id: '3.1',
        type: 'geolocation',
        label: 'Location',
        noLabel: false,
        name: 'location',
      },
    ],
  },
];

const apiEntity: Entity = {
  _id: '1',
  language: 'en',
  mongoLanguage: 'en',
  sharedId: 'shared1',
  title: 'Title of the entity',
  user: 'user',
  icon: {
    _id: 'ECU',
    label: 'Ecuador',
    type: 'Flags',
  },
  template: 'template1',
  creationDate: 1759374706197, // Oct 2, 2025
  editDate: 1760366924144, // Oct 13, 2025
  metadata: {
    simple_text: [
      {
        value: 'Emergency incident report from downtown area',
      },
    ],
    rich_text_field: [
      {
        value: '**Bold text**, *italic text*, and a [link](https://example.com)',
      },
    ],
    single_date: [
      {
        value: 1704067200, // Jan 1, 2024
      },
    ],
    multiple_dates: [
      {
        value: 1704067200, // Jan 1, 2024
      },
      {
        value: 1704153600, // Jan 2, 2024
      },
      {
        value: 1704240000, // Jan 3, 2024
      },
    ],
    date_range: [
      {
        value: {
          from: 1704067200, // Jan 1, 2024
          to: 1704153600, // Jan 2, 2024
        },
      },
    ],
    multiple_date_ranges: [
      {
        value: {
          from: 1704067200, // Jan 1, 2024
          to: 1704153600, // Jan 2, 2024
        },
      },
      {
        value: {
          from: 1704153600, // Jan 2, 2024
          to: 1704240000, // Jan 3, 2024
        },
      },
    ],
    status_selection: [
      {
        value: 'thes2.2',
        label: 'Second event',
      },
    ],
    category_tags: [
      {
        value: 'thes1.1',
        label: 'Acknowledging',
      },
      {
        value: 'thes.g.1',
        label: 'verb1',
        parent: {
          value: 'thes.g',
          label: 'Grouped verbs',
        },
      },
    ],
    related_people: [
      {
        value: 'entity2',
        label: 'Maria Rodriguez - Witness',
        icon: {
          _id: 'ECU',
          label: 'Ecuador',
          type: 'Flags',
        },
        type: 'entity',
        inheritedValue: [
          {
            value: 'thes1.2',
            label: 'Again',
          },
          {
            value: 'thes1.1',
            label: 'Acknowledging',
          },
        ],
        inheritedType: 'multiselect',
      },
      {
        value: 'entity3',
        label: 'John Smith - Reporter',
        icon: '',
        type: 'entity',
        inheritedValue: [],
        inheritedType: 'multiselect',
      },
    ],
    external_link: [
      {
        value: {
          label: 'Police Report',
          url: 'https://police.gov/reports/incident-2024-001',
        },
      },
    ],
    selected_image: [
      {
        value: '/short-video-thumbnail.jpg',
      },
    ],
    preview_document: [
      {
        value: '/batman.jpg',
      },
    ],
    video_of_event: [
      {
        value:
          '(/short-video.mp4, {"timelinks":{"00:00:02":"Timelink 1","00:00:04": "Timelink 2"}})',
      },
    ],
    location_on_map: [
      {
        value: {
          lat: 40.7128,
          lon: -74.006,
        },
      },
    ],
  },
  documents: [],
  attachments: [
    {
      _id: 'att1',
      entity: 'shared1',
      filename: 'photo.jpg',
      originalname: 'Event photo.jpg',
      mimetype: 'image/jpeg',
      size: 245000,
      type: 'attachment',
    },
    {
      _id: 'att2',
      entity: 'shared1',
      filename: 'clip.mp4',
      originalname: 'Event clip.mp4',
      mimetype: 'video/mp4',
      size: 1250000,
      type: 'attachment',
    },
  ],
};

export { apiEntity, thesauri, templates };
