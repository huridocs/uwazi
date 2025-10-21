/* eslint-disable max-lines */
import { ClientSettings, ClientThesaurus, Template } from 'app/apiResponseTypes';
import { ProcessingContext } from 'app/V2/application';
import { EntitySchema } from 'shared/types/entityType';

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
        id: 'thes3.3',
      },
    ],
  },
];

const templates: Template[] = [
  {
    _id: 'template1',
    name: 'This is the title of Template 1',
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
        _id: '1.2',
        type: 'markdown',
        label: 'Markdown field using standar markdown syntax',
        noLabel: false,
        name: 'markdown_syntax',
      },
      {
        _id: '1.2',
        type: 'markdown',
        label: 'Markdown field using sanitized HTML tags',
        noLabel: false,
        name: 'markdown_html',
      },
      {
        _id: '1.3',
        type: 'date',
        label: 'Date',
        noLabel: false,
        name: 'single_date',
      },
      {
        _id: '1.4',
        type: 'geolocation',
        label: 'Single geolocation property',
        noLabel: false,
        name: 'location_of_interest',
      },
      {
        _id: '1.5',
        type: 'multidate',
        label: 'Multiple single dates',
        noLabel: false,
        name: 'multiple_dates',
      },
      {
        _id: '1.6',
        type: 'daterange',
        label: 'Single range date',
        noLabel: false,
        name: 'date_range',
      },
      {
        _id: '1.7',
        type: 'multidaterange',
        label: 'Multiple ranges of dates',
        noLabel: false,
        name: 'multiple_date_ranges',
      },
      {
        _id: '1.8',
        content: 'thes1',
        type: 'select',
        label: 'Single select',
        noLabel: false,
        name: 'status_selection',
      },
      {
        _id: '1.9',
        content: 'thes1',
        type: 'multiselect',
        label: 'Multiple selector',
        noLabel: false,
        name: 'category_tags',
      },
      {
        _id: '1.10',
        content: 'template2',
        type: 'relationship',
        label: 'Relationship with inheritance',
        noLabel: false,
        relationType: 'rel1',
        inherit: {
          property: '2.4',
          type: 'multiselect',
        },
        name: 'related_people',
      },
      {
        _id: '1.11',
        content: 'template2',
        type: 'relationship',
        label: 'Regular relationship with no inheritance',
        noLabel: false,
        relationType: 'rel2',
        name: 'nearby_incidents',
      },
      {
        _id: '1.12',
        type: 'link',
        label: 'External link',
        noLabel: false,
        name: 'external_link',
      },
      {
        _id: '1.13',
        type: 'image',
        label: 'Media with an image',
        noLabel: false,
        style: 'fill',
        name: 'selected_image',
      },
      {
        _id: '1.14',
        type: 'preview',
        label: 'Preview of the main document (treated as an image field)',
        noLabel: false,
        style: 'fit',
        name: 'preview_document',
      },
      {
        _id: '1.15',
        type: 'media',
        label: 'Media video with timelinks',
        noLabel: false,
        name: 'video_of_event',
      },
      {
        _id: '1.16',
        type: 'geolocation',
        label: 'Grouped geolocation 1',
        noLabel: false,
        name: 'incident_location',
      },
      {
        _id: '1.17',
        type: 'geolocation',
        label: 'Grouped geolocation 2',
        noLabel: false,
        name: 'secondary_location',
      },
      {
        _id: '1.18',
        content: 'template3',
        type: 'relationship',
        label: 'Grouped geolocation 3 (inherited)',
        noLabel: false,
        relationType: 'rel3',
        inherit: {
          property: '3.4',
          type: 'geolocation',
        },
        name: 'location_relationships',
      },
      {
        _id: '1.19',
        type: 'generatedid',
        label: 'Property with generated ID',
        noLabel: false,
        name: 'document_id',
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
        content: 'thes2',
        _id: '2.4',
        type: 'multiselect',
        label: 'Multiselect from events',
        noLabel: false,
        name: 'multiselect',
      },
      {
        _id: '2.5',
        type: 'geolocation',
        label: 'Geolocation from events',
        noLabel: false,
        name: 'geolocationd_geolocation',
      },
    ],
    color: '#16bdca',
  },
  {
    _id: 'template3',
    name: 'Geolocated data',
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
        _id: '3.4',
        type: 'geolocation',
        label: 'Geolocation',
        noLabel: false,
        name: 'geolocationd_geolocation',
      },
    ],
    color: '#Ad11e0',
  },
];

const settings: ClientSettings = {
  dateFormat: 'DDD',
  site_name: 'Uwazi',
  languages: [
    {
      key: 'en',
      label: 'English',
      default: true,
    },
  ],
};

const rawEntity: EntitySchema = {
  _id: '1',
  language: 'en',
  mongoLanguage: 'en',
  sharedId: 'shared1',
  title: 'Title of the displayed entity',
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
    markdown_html: [
      {
        value:
          '<p>This <b>Markdown</b> field includes <i>simple HTML</i> tags and a <a href="https://example.com" target="_blank">link</a>.</p>',
      },
    ],
    markdown_syntax: [
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
        value: 'thes1.2',
        label: 'Again',
      },
    ],
    category_tags: [
      {
        value: 'thes1.1',
        label: 'Acknowledging',
      },
      {
        value: 'thes1.2',
        label: 'Again',
      },
      {
        label: 'verb2',
        value: 'thes1.g.2',
        parent: {
          value: 'thes1.g',
          label: 'Grouped verbs',
        },
      },
      {
        value: 'thes1.g.1',
        label: 'verb1',
        parent: {
          value: 'the1.g',
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
    nearby_incidents: [
      {
        value: 'entity4',
        label: 'Traffic Accident - Main Street',
        icon: {
          _id: 'ECU',
          label: 'Ecuador',
          type: 'Flags',
        },
        type: 'entity',
      },
      {
        value: 'entity5',
        label: 'Fire Incident - Downtown',
        icon: '',
        type: 'entity',
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
        alt: 'Alternative text for image',
      },
    ],
    preview_document: [
      {
        value: '/batman.jpg',
        alt: 'Alternative text pdf preview',
      },
    ],
    video_of_event: [
      {
        value:
          '(/short-video.mp4, {"timelinks":{"00:00:02":"Timelink 1","00:00:04": "Timelink 2"}})',
        alt: 'Alternative text',
      },
    ],
    incident_location: [
      {
        value: {
          lat: 44.33301685687683,
          lon: 5.998535156250001,
          label: '',
        },
      },
    ],
    secondary_location: [
      {
        value: {
          lat: 62.58069554111894,
          lon: 15.468750000000002,
          label: '',
        },
      },
    ],
    location_relationships: [
      {
        value: 'entity6',
        label: 'Witness Location - Maria Rodriguez',
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
              label: 'Witness Home Address',
            },
          },
        ],
        inheritedType: 'geolocation',
      },
      {
        value: 'entity7',
        label: 'Reporter Location - John Smith',
        icon: '',
        type: 'entity',
        inheritedValue: [],
        inheritedType: 'geolocation',
      },
    ],
    document_id: [
      {
        value: 'document1',
      },
    ],
    hierarchical_relationships: [
      {
        value: '6qdshinfobf',
        label: 'Emergency Response Team (not defined in template)',
        icon: '',
        type: 'entity',
        inheritedValue: [
          {
            value: 'entity7',
            label: 'First Responders',
            icon: '',
            type: 'entity',
            inheritedValue: [
              {
                value: 'entity8',
                label: 'Police Officer - Maria Rodriguez',
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
            ],
            inheritedType: 'relationship',
          },
        ],
        inheritedType: 'relationship',
      },
    ],
  },
  documents: [
    {
      _id: 'batman',
      entity: 'shared1',
      type: 'document',
      filename: 'batman.pdf',
      originalname: 'Anoying rich kid.pdf',
      mimetype: 'application/pdf',
      size: 1,
      status: 'ready',
      creationDate: 1760792421312,
      language: 'en',
      totalPages: 1,
    },
  ],
};

const processingContextBase: Omit<ProcessingContext, 'templates' | 'settings' | 'thesauri'> = {
  includeTemplate: true,
  onlyForCards: true,
  dateFormat: 'LLL d, yyyy',
  translateLabels: true,
  language: 'en',
  translations: [],
  currentUser: undefined,
};

export { rawEntity, processingContextBase, thesauri, templates, settings };
