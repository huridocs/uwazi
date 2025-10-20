import { EntitySchema } from 'shared/types/entityType';
import { ProcessingContext } from '../types';

export const rawEntity: EntitySchema = {
  _id: 'entity.test-incident',
  language: 'en',
  mongoLanguage: 'en',
  sharedId: 'test-incident-001',
  title: 'Test Incident Report',
  template: 'template.incident-report',
  published: false,
  creationDate: 1759374706197,
  editDate: 1760366924144,
  metadata: {
    simple_text: [
      {
        value: 'Test incident report',
      },
    ],
    outdated_field: [
      {
        value: 'Outdated Field - not in result',
      },
    ],
    markdown_syntax: [
      {
        value: '# Test Report\n**Status:** Under Investigation',
      },
    ],
    single_date: [
      {
        value: 1759363200,
      },
    ],
    location_of_interest: [
      {
        value: {
          lat: 46.3964365565104,
          lon: 3.6694335937500004,
          label: '',
        },
      },
    ],
    multiple_dates: [
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
    date_range: [
      {
        value: {
          from: 1759276800,
          to: 1761955199,
        },
      },
    ],
    multiple_date_ranges: [
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
    status_selection: [
      {
        value: 'thesaurus.again',
        label: 'Again',
      },
    ],
    category_tags: [
      {
        value: 'thesaurus.acknowledging',
        label: 'Acknowledging',
      },
      {
        value: 'thesaurus.again',
        label: 'Again',
      },
      {
        value: 'thesaurus.verb2',
        label: 'verb2',
        parent: {
          value: 'thesaurus.grouped',
          label: 'grouped',
        },
      },
      {
        value: 'thesaurus.verb1',
        label: 'verb1',
        parent: {
          value: 'thesaurus.grouped',
          label: 'grouped',
        },
      },
    ],
    related_people: [
      {
        value: 'entity.witness-maria',
        label: 'Maria Rodriguez - Witness',
        icon: {
          _id: 'ECU',
          label: 'Ecuador',
          type: 'Flags',
        },
        type: 'entity',
        inheritedValue: [
          {
            value: 'thesaurus.again',
            label: 'Again',
          },
          {
            value: 'thesaurus.acknowledging',
            label: 'Acknowledging',
          },
        ],
        inheritedType: 'multiselect',
      },
      {
        value: 'entity.reporter-john',
        label: 'John Smith - Reporter',
        icon: '',
        type: 'entity',
        inheritedValue: [
          {
            value: 'thesaurus.expressing',
            label: 'Expressing',
          },
          {
            value: 'thesaurus.verb2',
            label: 'verb2',
            parent: {
              value: 'thesaurus.grouped',
              label: 'grouped',
            },
          },
        ],
        inheritedType: 'multiselect',
      },
    ],
    nearby_incidents: [
      {
        value: 'entity.witness-maria',
        label: 'Traffic Accident - Main Street',
        icon: {
          _id: 'ECU',
          label: 'Ecuador',
          type: 'Flags',
        },
        type: 'entity',
      },
      {
        value: 'entity.reporter-john',
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
        value: '/api/files/test-image.png',
      },
    ],
    preview_document: [
      {
        value: '',
      },
    ],
    video_of_event: [
      {
        value:
          '(/api/files/test-video.mp4, {"timelinks":{"00:20:15":"control","01:30:45":"Test timelink"}})',
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
        value: 'entity.witness-maria',
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
        value: 'entity.reporter-john',
        label: 'Reporter Location - John Smith',
        icon: '',
        type: 'entity',
        inheritedValue: [],
        inheritedType: 'geolocation',
      },
    ],
    document_id: [
      {
        value: 'EVT-2024-001',
      },
    ],
    numeric_value: [
      {
        value: 42.5,
      },
    ],
    negative_numeric: [
      {
        value: -15.75,
      },
    ],
    zero_numeric: [
      {
        value: 0,
      },
    ],
    hierarchical_relationships: [
      {
        value: 'entity.emergency-team',
        label: 'Emergency Response Team',
        icon: '',
        type: 'entity',
        inheritedValue: [
          {
            value: 'entity.first-responders',
            label: 'First Responders',
            icon: '',
            type: 'entity',
            inheritedValue: [
              {
                value: 'entity.witness-maria',
                label: 'Police Officer - Maria Rodriguez',
                icon: {
                  _id: 'ECU',
                  label: 'Ecuador',
                  type: 'Flags',
                },
                type: 'entity',
                inheritedValue: [
                  {
                    value: 'thesaurus.again',
                    label: 'Again',
                  },
                  {
                    value: 'thesaurus.acknowledging',
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
  user: 'user.admin',
  permissions: [
    {
      refId: 'user.admin',
      type: 'user',
      level: 'write',
    },
  ],
  obsoleteMetadata: [],
  __v: 11,
};

export const processingContext: ProcessingContext = {
  includeTemplate: true,
  combineGeolocation: true,
  onlyForCards: true,
  formatDates: true,
  dateFormat: 'LLL d, yyyy',
  translateLabels: true,
  includeOptions: false,
  language: 'en',
  translations: [
    {
      locale: 'en',
      contexts: [
        {
          id: 'thesaurus.verbs',
          label: 'Verbs',
          type: 'Thesaurus',
          values: {
            Verbs: 'Verbs EN',
            Acknowledging: 'Acknowledging EN',
            Again: 'Again EN',
            Expressing: 'Expressing EN',
            grouped: 'grouped EN',
            verb1: 'verb1 EN',
            verb2: 'verb2 EN',
          },
        },
        {
          id: 'template.incident-report',
          label: 'Incident Report Template',
          type: 'Entity',
          values: {
            'Incident Report Template': 'Incident Report Template EN',
            'Simple Text': 'Simple Text EN',
            'Markdown Syntax': 'Markdown Syntax EN',
            'Single Date': 'Single Date EN',
            'Multiple Dates': 'Multiple Dates EN',
            'Date Range': 'Date Range EN',
            'Status Selection': 'Status Selection EN',
            'Category Tags': 'Category Tags EN',
            'Related People': 'Related People EN',
            'External Link': 'External Link EN',
            'Selected Image': 'Selected Image EN',
            'Preview Document': 'Preview Document EN',
            'Video of Event': 'Video of Event EN',
            'Incident Location': 'Incident Location EN',
            'Document ID': 'Document ID EN',
            'Numeric Value': 'Numeric Value EN',
            'Negative Numeric': 'Negative Numeric EN',
            'Zero Numeric': 'Zero Numeric EN',
            'Location of Interest': 'Location of Interest EN',
            'Multiple Date Ranges': 'Multiple Date Ranges EN',
            'Nearby Incidents': 'Nearby Incidents EN',
            'Secondary Location': 'Secondary Location EN',
            'Location Relationships': 'Location Relationships EN',
            'Hierarchical Relationships': 'Hierarchical Relationships EN',
          },
        },
      ],
    },
  ],
  templates: [
    {
      _id: 'template.incident-report',
      color: '#C03B22',
      properties: [
        {
          _id: 'prop.simple-text',
          type: 'text',
          label: 'Simple Text',
          name: 'simple_text',
          noLabel: false,
          required: false,
          showInCard: true,
          style: '',
          generatedId: false,
        },
        {
          _id: 'prop.markdown-syntax',
          type: 'markdown',
          label: 'Markdown Syntax',
          name: 'markdown_syntax',
          noLabel: false,
          required: false,
          showInCard: false,
          style: '',
          generatedId: false,
        },
        {
          _id: 'prop.single-date',
          type: 'date',
          label: 'Single Date',
          name: 'single_date',
          noLabel: false,
          required: true,
          showInCard: true,
          style: '',
          generatedId: false,
        },
        {
          _id: 'prop.location-interest',
          type: 'geolocation',
          label: 'Location of Interest',
          name: 'location_of_interest',
          noLabel: false,
          required: false,
          showInCard: true,
          style: '',
          generatedId: false,
        },
        {
          _id: 'prop.multiple-dates',
          type: 'multidate',
          label: 'Multiple Dates',
          name: 'multiple_dates',
          noLabel: false,
          required: false,
          showInCard: false,
          style: '',
          generatedId: false,
        },
        {
          _id: 'prop.date-range',
          type: 'daterange',
          label: 'Date Range',
          name: 'date_range',
          noLabel: false,
          required: false,
          showInCard: true,
          style: '',
          generatedId: false,
        },
        {
          _id: 'prop.multiple-date-ranges',
          type: 'multidaterange',
          label: 'Multiple Date Ranges',
          name: 'multiple_date_ranges',
          noLabel: false,
          required: false,
          showInCard: false,
          style: '',
          generatedId: false,
        },
        {
          content: 'thesaurus.verbs',
          _id: 'prop.status-selection',
          type: 'select',
          label: 'Status Selection',
          name: 'status_selection',
          noLabel: false,
          required: false,
          showInCard: true,
          style: '',
          generatedId: false,
        },
        {
          content: 'thesaurus.verbs',
          _id: 'prop.category-tags',
          type: 'multiselect',
          label: 'Category Tags',
          name: 'category_tags',
          noLabel: false,
          required: false,
          showInCard: true,
          style: '',
          generatedId: false,
        },
        {
          content: 'template.incident-report',
          _id: 'prop.related-people',
          type: 'relationship',
          label: 'Related People',
          relationType: 'relation.related-to',
          inherit: {
            property: 'prop.category-tags',
            type: 'multiselect',
          },
          name: 'related_people',
          noLabel: false,
          required: false,
          showInCard: true,
          style: '',
          generatedId: false,
        },
        {
          content: 'template.incident-report',
          _id: 'prop.nearby-incidents',
          type: 'relationship',
          label: 'Nearby Incidents',
          relationType: 'relation.related-to',
          name: 'nearby_incidents',
          noLabel: false,
          required: false,
          showInCard: false,
          style: '',
          generatedId: false,
        },
        {
          _id: 'prop.external-link',
          type: 'link',
          label: 'External Link',
          name: 'external_link',
          noLabel: false,
          required: false,
          showInCard: true,
          style: '',
          generatedId: false,
        },
        {
          _id: 'prop.selected-image',
          type: 'image',
          label: 'Selected Image',
          name: 'selected_image',
          noLabel: false,
          required: false,
          showInCard: true,
          style: 'fill',
          generatedId: false,
        },
        {
          _id: 'prop.preview-document',
          type: 'preview',
          label: 'Preview Document',
          name: 'preview_document',
          noLabel: false,
          required: false,
          showInCard: false,
          style: 'fill',
          generatedId: false,
        },
        {
          _id: 'prop.video-event',
          type: 'media',
          label: 'Video of Event',
          name: 'video_of_event',
          noLabel: false,
          required: false,
          showInCard: true,
          style: '',
          generatedId: false,
        },
        {
          _id: 'prop.incident-location',
          type: 'geolocation',
          label: 'Incident Location',
          name: 'incident_location',
          noLabel: false,
          required: false,
          showInCard: true,
          style: '',
          generatedId: false,
        },
        {
          _id: 'prop.secondary-location',
          type: 'geolocation',
          label: 'Secondary Location',
          name: 'secondary_location',
          noLabel: false,
          required: false,
          showInCard: false,
          style: '',
          generatedId: false,
        },
        {
          content: 'template.incident-report',
          _id: 'prop.location-relationships',
          type: 'relationship',
          label: 'Location Relationships',
          relationType: 'relation.related-to',
          inherit: {
            property: 'prop.location-interest',
            type: 'geolocation',
          },
          name: 'location_relationships',
          noLabel: false,
          required: false,
          showInCard: true,
          style: '',
          generatedId: false,
        },
        {
          _id: 'prop.document-id',
          type: 'generatedid',
          label: 'Document ID',
          name: 'document_id',
          noLabel: false,
          required: false,
          showInCard: true,
          style: '',
          generatedId: false,
        },
        {
          _id: 'prop.numeric-value',
          type: 'numeric',
          label: 'Numeric Value',
          name: 'numeric_value',
          noLabel: false,
          required: false,
          showInCard: true,
          style: '',
          generatedId: false,
        },
        {
          _id: 'prop.negative-numeric',
          type: 'numeric',
          label: 'Negative Numeric',
          name: 'negative_numeric',
          noLabel: false,
          required: false,
          showInCard: false,
          style: '',
          generatedId: false,
        },
        {
          _id: 'prop.zero-numeric',
          type: 'numeric',
          label: 'Zero Numeric',
          name: 'zero_numeric',
          noLabel: false,
          required: false,
          showInCard: false,
          style: '',
          generatedId: false,
        },
        {
          content: 'template.middle',
          _id: 'prop.hierarchical-relationships',
          type: 'relationship',
          label: 'Hierarchical Relationships',
          relationType: 'relation.related-to',
          inherit: {
            property: 'prop.relationship-n2',
            type: 'relationship',
          },
          name: 'hierarchical_relationships',
          noLabel: false,
          required: false,
          showInCard: true,
          style: '',
          generatedId: false,
        },
      ],
      commonProperties: [
        {
          _id: 'common.title',
          label: 'Title',
          name: 'title',
          type: 'text',
          isCommonProperty: true,
        },
        {
          _id: 'common.creation-date',
          label: 'Date added',
          name: 'creationDate',
          type: 'date',
          isCommonProperty: true,
        },
        {
          _id: 'common.edit-date',
          label: 'Date modified',
          name: 'editDate',
          type: 'date',
          isCommonProperty: true,
        },
      ],
      entityViewPage: '',
      name: 'Incident Report Template',
    },
  ],
  settings: {
    dateFormat: 'DDD',
    site_name: 'Uwazi',
    languages: [
      {
        key: 'en',
        label: 'English',
        default: true,
      },
    ],
  },
  thesauri: [
    {
      _id: 'thesaurus.verbs',
      name: 'Verbs',
      values: [
        {
          label: 'Acknowledging',
          id: 'thesaurus.acknowledging',
        },
        {
          label: 'Again',
          id: 'thesaurus.again',
        },
        {
          label: 'Expressing',
          id: 'thesaurus.expressing',
        },
        {
          label: 'grouped',
          values: [
            {
              label: 'verb1',
              id: 'thesaurus.verb1',
            },
            {
              label: 'verb2',
              id: 'thesaurus.verb2',
            },
          ],
          id: 'thesaurus.grouped',
        },
      ],
    },
  ],
  currentUser: {
    _id: 'user.admin',
    username: 'admin',
    email: 'admin@uwazi.com',
    role: 'admin',
    groups: [],
  },
};
