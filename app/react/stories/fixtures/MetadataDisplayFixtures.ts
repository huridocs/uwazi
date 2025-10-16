/* eslint-disable max-lines */
import { ProcessingContext } from 'app/V2/application';
import { EntitySchema } from 'shared/types/entityType';

const rawEntity: EntitySchema = {
  _id: '1',
  language: 'en',
  mongoLanguage: 'en',
  sharedId: 'shared1',
  title: 'Emergency Incident Report - Downtown Traffic Accident',
  template: 'template1',
  creationDate: 1704067200, // Jan 1, 2024 (seconds)
  editDate: 1704153600, // Jan 2, 2024 (seconds)
  metadata: {
    simple_text: [
      {
        value: 'Emergency incident report from downtown area',
      },
    ],
    markdown_html: [
      {
        value:
          '<p>This <b>Markdown</b> field includes <i>simple HTML</i> tags and a <a href="https://example.com">link</a>.</p>',
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
        value: '9e22a1af-75d7-49a2-b9d8-9ec77939b630',
        label: 'Again',
      },
    ],
    category_tags: [
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
    // related_people: [
    //   {
    //     value: 'xjku67dv7b',
    //     label: 'Maria Rodriguez - Witness',
    //     icon: {
    //       _id: 'ECU',
    //       label: 'Ecuador',
    //       type: 'Flags',
    //     },
    //     type: 'entity',
    //     inheritedValue: [
    //       {
    //         value: '9e22a1af-75d7-49a2-b9d8-9ec77939b630',
    //         label: 'Again',
    //       },
    //       {
    //         value: '765ab6ca-56a1-4948-9dc9-17fc0aa30843',
    //         label: 'Acknowledging',
    //       },
    //     ],
    //     inheritedType: 'multiselect',
    //   },
    //   {
    //     value: '4oklamamet',
    //     label: 'John Smith - Reporter',
    //     icon: '',
    //     type: 'entity',
    //     inheritedValue: [],
    //     inheritedType: 'multiselect',
    //   },
    // ],
    // nearby_incidents: [
    //   {
    //     value: 'xjku67dv7b',
    //     label: 'Traffic Accident - Main Street',
    //     icon: {
    //       _id: 'ECU',
    //       label: 'Ecuador',
    //       type: 'Flags',
    //     },
    //     type: 'entity',
    //   },
    //   {
    //     value: '4oklamamet',
    //     label: 'Fire Incident - Downtown',
    //     icon: '',
    //     type: 'entity',
    //   },
    // ],
    // external_link: [
    //   {
    //     value: {
    //       label: 'Police Report',
    //       url: 'https://police.gov/reports/incident-2024-001',
    //     },
    //   },
    // ],
    // selected_image: [
    //   {
    //     value: '/short-video-thumbnail.jpg',
    //     alt: 'Alternative text for image',
    //   },
    // ],
    // preview_document: [
    //   {
    //     value: '/batman.jpg',
    //     alt: 'Alternative text pdf preview',
    //   },
    // ],
    // video_of_event: [
    //   {
    //     value:
    //       '(/short-video.mp4, {"timelinks":{"00:20:15":"control","01:30:45":"Test timelink"}})',
    //     alt: 'Alternative text',
    //   },
    // ],
    // incident_location: [
    //   {
    //     value: {
    //       lat: 44.33301685687683,
    //       lon: 5.998535156250001,
    //       label: '',
    //     },
    //   },
    // ],
    // secondary_location: [
    //   {
    //     value: {
    //       lat: 62.58069554111894,
    //       lon: 15.468750000000002,
    //       label: '',
    //     },
    //   },
    // ],
    // location_relationships: [
    //   {
    //     value: 'xjku67dv7b',
    //     label: 'Witness Location - Maria Rodriguez',
    //     icon: {
    //       _id: 'ECU',
    //       label: 'Ecuador',
    //       type: 'Flags',
    //     },
    //     type: 'entity',
    //     inheritedValue: [
    //       {
    //         value: {
    //           lat: 43.80157978110818,
    //           lon: 7.492675781250001,
    //           label: 'Witness Home Address',
    //         },
    //       },
    //     ],
    //     inheritedType: 'geolocation',
    //   },
    //   {
    //     value: '4oklamamet',
    //     label: 'Reporter Location - John Smith',
    //     icon: '',
    //     type: 'entity',
    //     inheritedValue: [],
    //     inheritedType: 'geolocation',
    //   },
    // ],
    // document_id: [
    //   {
    //     value: 'EVT-2024-001',
    //   },
    // ],
    // hierarchical_relationships: [
    //   {
    //     value: '6qdshinfobf',
    //     label: 'Emergency Response Team',
    //     icon: '',
    //     type: 'entity',
    //     inheritedValue: [
    //       {
    //         value: '7jdr88mnow6',
    //         label: 'First Responders',
    //         icon: '',
    //         type: 'entity',
    //         inheritedValue: [
    //           {
    //             value: 'xjku67dv7b',
    //             label: 'Police Officer - Maria Rodriguez',
    //             icon: {
    //               _id: 'ECU',
    //               label: 'Ecuador',
    //               type: 'Flags',
    //             },
    //             type: 'entity',
    //             inheritedValue: [
    //               {
    //                 value: '9e22a1af-75d7-49a2-b9d8-9ec77939b630',
    //                 label: 'Again',
    //               },
    //               {
    //                 value: '765ab6ca-56a1-4948-9dc9-17fc0aa30843',
    //                 label: 'Acknowledging',
    //               },
    //             ],
    //             inheritedType: 'multiselect',
    //           },
    //         ],
    //         inheritedType: 'relationship',
    //       },
    //     ],
    //     inheritedType: 'relationship',
    //   },
    // ],
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
  translations: [
    {
      locale: 'en',
      contexts: [
        {
          id: '5bfbb1a0471dd0fc16ada146',
          label: 'Event Report',
          type: 'Entity',
          values: {
            'Event Report': 'Event Report EN',
            Date: 'Date',
            Title: 'Title',
            Multiselect: 'Multiselect',
            Markdown: 'Markdown',
            'Multiselect from text': 'Multiselect from text',
            GeolocationD: 'GeolocationD',
          },
        },
        {
          id: '68d6ed4891b591b7432b276b',
          label: 'Verbs',
          type: 'Thesaurus',
          values: {
            Verbs: 'Verbs',
            Acknowledging: 'Acknowledging',
            Again: 'Again',
            Confirming: 'Confirming',
            Expressing: 'Expressing',
            grouped: 'grouped',
            verb1: 'verb1',
            verb2: 'verb2',
          },
        },
        {
          id: '68da997861bceda4fe0d6d25',
          label: 'TextDocument',
          type: 'Entity',
          values: {
            Numeric: 'Numeric',
            Markdown: 'Markdown',
            TextDocument: 'TextDocument',
            Title: 'Title',
            Multiselect: 'Multiselect',
          },
        },
        {
          id: '68da99b961bceda4fe0d6ddd',
          label: 'related from',
          values: {
            'related from': 'related from',
          },
        },
        {
          id: '68da99d961bceda4fe0d6e0f',
          label: 'related to',
          type: 'Relationship Type',
          values: {
            'related to': 'related to',
          },
        },
        {
          id: '68ddecdbc9474e23bb5e914b',
          label: 'Emergency Incident Report Template',
          type: 'Entity',
          values: {
            'Simple Text': 'Simple Text',
            'Markdown Syntax': 'Markdown Syntax',
            'Single Date': 'Single Date',
            'Multiple Dates': 'Multiple Dates',
            'Date Range': 'Date Range',
            'Status Selection': 'Status Selection',
            'Category Tags': 'Category Tags',
            'Related People': 'Related People',
            'External Link': 'External Link',
            'Selected Image': 'Selected Image',
            'Preview Document': 'Preview Document',
            'Video of Event': 'Video of Event',
            'Incident Location': 'Incident Location',
            'Document ID': 'Document ID',
            'Emergency Incident Report Template': 'Emergency Incident Report Template',
            Title: 'Title',
            'Multiple Date Ranges': 'Multiple Date Ranges',
            'Nearby Incidents': 'Nearby Incidents',
            'Secondary Location': 'Secondary Location',
            'Location Relationships': 'Location Relationships',
            'Location of Interest': 'Location of Interest',
            'Hierarchical Relationships': 'Hierarchical Relationships',
          },
        },
        {
          id: '68ec577980a3354966fb293c',
          label: 'middle',
          type: 'Entity',
          values: {
            middle: 'middle',
            Title: 'Title',
            'Relationship n-2': 'Relationship n-2',
          },
        },
        {
          id: '68ec5bf780a3354966fb2c25',
          label: 'extra level',
          type: 'Entity',
          values: {
            'extra level': 'extra level',
            Title: 'Title',
            'Relationship n-1': 'Relationship n-1',
          },
        },
      ],
    },
  ],
  templates: [
    {
      _id: '5bfbb1a0471dd0fc16ada146',
      name: 'Event Report',
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
        {
          _id: '68da9640ea8d8c69971bf274',
          label: 'Date modified',
          name: 'editDate',
          type: 'date',
          isCommonProperty: true,
        },
      ],
      properties: [
        {
          content: '68d6ed4891b591b7432b276b',
          _id: '68d6f62891b591b7432b2b4b',
          type: 'multiselect',
          label: 'Multiselect',
          noLabel: false,
          required: false,
          showInCard: false,
          style: '',
          generatedId: false,
          name: 'multiselect',
        },
        {
          _id: '68e5e0eb192fccdd1003624b',
          type: 'geolocation',
          label: 'GeolocationD',
          noLabel: false,
          required: false,
          showInCard: false,
          style: '',
          generatedId: false,
          name: 'geolocationd_geolocation',
        },
      ],
      __v: 8,
      default: false,
      color: '#16bdca',
      entityViewPage: '',
    },
    {
      _id: '68da997861bceda4fe0d6d25',
      color: '#C03B22',
      properties: [
        {
          _id: '68da997861bceda4fe0d6d26',
          type: 'numeric',
          label: 'Numeric',
          noLabel: false,
          required: false,
          showInCard: false,
          style: '',
          generatedId: false,
          name: 'numeric',
        },
        {
          _id: '68da997861bceda4fe0d6d27',
          type: 'markdown',
          label: 'Markdown',
          noLabel: false,
          required: false,
          showInCard: false,
          style: '',
          generatedId: false,
          name: 'markdown',
        },
        {
          content: '68d6ed4891b591b7432b276b',
          _id: '68da999561bceda4fe0d6da6',
          type: 'multiselect',
          label: 'Multiselect',
          noLabel: false,
          required: false,
          showInCard: false,
          style: '',
          generatedId: false,
          name: 'multiselect',
        },
      ],
      commonProperties: [
        {
          _id: '68da997861bceda4fe0d6d28',
          label: 'Title',
          name: 'title',
          type: 'text',
          isCommonProperty: true,
        },
        {
          _id: '68da997861bceda4fe0d6d29',
          label: 'Date added',
          name: 'creationDate',
          type: 'date',
          isCommonProperty: true,
        },
        {
          _id: '68da997861bceda4fe0d6d2a',
          label: 'Date modified',
          name: 'editDate',
          type: 'date',
          isCommonProperty: true,
        },
      ],
      entityViewPage: '',
      name: 'TextDocument',
      __v: 2,
      default: true,
    },
    {
      _id: 'template1',
      color: '#C03B22',
      properties: [
        {
          _id: '68ddecdbc9474e23bb5e914c',
          type: 'text',
          label: 'Text Label',
          noLabel: false,
          required: false,
          showInCard: false,
          style: '',
          generatedId: false,
          name: 'simple_text',
        },
        {
          _id: '68ddecdbc9474e23bb5e914d',
          type: 'markdown',
          label: 'Markdown',
          noLabel: false,
          required: false,
          showInCard: false,
          style: '',
          generatedId: false,
          name: 'markdown_syntax',
        },
        {
          _id: '68ddecdbc9474e23bb5e914e',
          type: 'date',
          label: 'Date',
          noLabel: false,
          required: false,
          showInCard: false,
          style: '',
          generatedId: false,
          name: 'single_date',
        },
        {
          _id: '68e5e13b192fccdd10036334',
          type: 'geolocation',
          label: 'GeolocationIsolated',
          noLabel: false,
          required: false,
          showInCard: false,
          style: '',
          generatedId: false,
          name: 'location_of_interest',
        },
        {
          _id: '68ddecdbc9474e23bb5e914f',
          type: 'multidate',
          label: 'Multidate',
          noLabel: false,
          required: false,
          showInCard: false,
          style: '',
          generatedId: false,
          name: 'multiple_dates',
        },
        {
          _id: '68ddecdbc9474e23bb5e9150',
          type: 'daterange',
          label: 'Daterange',
          noLabel: false,
          required: false,
          showInCard: false,
          style: '',
          generatedId: false,
          name: 'date_range',
        },
        {
          _id: '68e56b29192fccdd10035c2a',
          type: 'multidaterange',
          label: 'Multidaterange',
          noLabel: false,
          required: false,
          showInCard: false,
          style: '',
          generatedId: false,
          name: 'multiple_date_ranges',
        },
        {
          content: '68d6ed4891b591b7432b276b',
          _id: '68ddecdbc9474e23bb5e9151',
          type: 'select',
          label: 'Select',
          noLabel: false,
          required: false,
          showInCard: false,
          style: '',
          generatedId: false,
          name: 'status_selection',
        },
        {
          content: '68d6ed4891b591b7432b276b',
          _id: '68ddecdbc9474e23bb5e9152',
          type: 'multiselect',
          label: 'Multiselect',
          noLabel: false,
          required: false,
          showInCard: false,
          style: '',
          generatedId: false,
          name: 'category_tags',
        },
        {
          content: '5bfbb1a0471dd0fc16ada146',
          _id: '68ddecdbc9474e23bb5e9153',
          type: 'relationship',
          label: 'Relationship',
          noLabel: false,
          required: false,
          showInCard: false,
          style: '',
          relationType: '68da99b961bceda4fe0d6ddd',
          inherit: {
            property: '68d6f62891b591b7432b2b4b',
            type: 'multiselect',
          },
          generatedId: false,
          name: 'related_people',
        },
        {
          content: '5bfbb1a0471dd0fc16ada146',
          _id: '68e585e4192fccdd10035da9',
          type: 'relationship',
          label: 'Relationship1',
          noLabel: false,
          required: false,
          showInCard: false,
          style: '',
          relationType: '68da99b961bceda4fe0d6ddd',
          generatedId: false,
          name: 'nearby_incidents',
        },
        {
          _id: '68ddecdbc9474e23bb5e9154',
          type: 'link',
          label: 'Link',
          noLabel: false,
          required: false,
          showInCard: false,
          style: '',
          generatedId: false,
          name: 'external_link',
        },
        {
          _id: '68ddecdbc9474e23bb5e9155',
          type: 'image',
          label: 'Image',
          noLabel: false,
          required: false,
          showInCard: false,
          style: 'fill',
          generatedId: false,
          name: 'selected_image',
        },
        {
          _id: '68ddecdbc9474e23bb5e9156',
          type: 'preview',
          label: 'Preview',
          noLabel: false,
          required: false,
          showInCard: false,
          style: 'fill',
          generatedId: false,
          name: 'preview_document',
        },
        {
          _id: '68ddecdbc9474e23bb5e9157',
          type: 'media',
          label: 'Media',
          noLabel: false,
          required: false,
          showInCard: false,
          style: '',
          generatedId: false,
          name: 'video_of_event',
        },
        {
          _id: '68ddecdbc9474e23bb5e9158',
          type: 'geolocation',
          label: 'Geolocation',
          noLabel: false,
          required: false,
          showInCard: false,
          style: '',
          generatedId: false,
          name: 'incident_location',
        },
        {
          _id: '68e5e0d9192fccdd100361d3',
          type: 'geolocation',
          label: 'Geolocation2',
          noLabel: false,
          required: false,
          showInCard: false,
          style: '',
          generatedId: false,
          name: 'secondary_location',
        },
        {
          content: '5bfbb1a0471dd0fc16ada146',
          _id: '68e5e119192fccdd100362cb',
          type: 'relationship',
          label: 'GeolocationR',
          noLabel: false,
          required: false,
          showInCard: false,
          style: '',
          relationType: '68da99b961bceda4fe0d6ddd',
          inherit: {
            property: '68e5e0eb192fccdd1003624b',
            type: 'geolocation',
          },
          generatedId: false,
          name: 'location_relationships',
        },
        {
          _id: '68ddecdbc9474e23bb5e9159',
          type: 'generatedid',
          label: 'Generatedid',
          noLabel: false,
          required: false,
          showInCard: false,
          style: '',
          generatedId: false,
          name: 'document_id',
        },
        {
          content: '68ec577980a3354966fb293c',
          _id: '68ed110f2bbc3dca9918f4bc',
          type: 'relationship',
          label: 'Relationship n-3',
          noLabel: false,
          required: false,
          showInCard: true,
          style: '',
          relationType: '68da99b961bceda4fe0d6ddd',
          inherit: {
            property: '68ec57a480a3354966fb2971',
            type: 'relationship',
          },
          generatedId: false,
          name: 'hierarchical_relationships',
        },
      ],
      commonProperties: [
        {
          _id: '68ddecdbc9474e23bb5e915a',
          label: 'Title',
          name: 'title',
          type: 'text',
          isCommonProperty: true,
        },
        {
          _id: '68ddecdbc9474e23bb5e915b',
          label: 'Date added',
          name: 'creationDate',
          type: 'date',
          isCommonProperty: true,
        },
        {
          _id: '68ddecdbc9474e23bb5e915c',
          label: 'Date modified',
          name: 'editDate',
          type: 'date',
          isCommonProperty: true,
        },
      ],
      entityViewPage: '',
      name: 'Emergency Incident Report Template',
      __v: 10,
    },
    {
      _id: '68ec577980a3354966fb293c',
      color: '#C03B22',
      properties: [
        {
          content: '68ec5bf780a3354966fb2c25',
          _id: '68ec57a480a3354966fb2971',
          type: 'relationship',
          label: 'Relationship n-2',
          noLabel: false,
          required: false,
          showInCard: true,
          style: '',
          relationType: '68da99b961bceda4fe0d6ddd',
          inherit: {
            property: '68ed10e32bbc3dca9918f3c7',
            type: 'relationship',
          },
          generatedId: false,
          name: 'relationship_n-2',
        },
      ],
      commonProperties: [
        {
          _id: '68ec577980a3354966fb293d',
          label: 'Title',
          name: 'title',
          type: 'text',
          isCommonProperty: true,
        },
        {
          _id: '68ec577980a3354966fb293e',
          label: 'Date added',
          name: 'creationDate',
          type: 'date',
          isCommonProperty: true,
        },
        {
          _id: '68ec577980a3354966fb293f',
          label: 'Date modified',
          name: 'editDate',
          type: 'date',
          isCommonProperty: true,
        },
      ],
      entityViewPage: '',
      name: 'middle',
      __v: 4,
    },
    {
      _id: '68ec5bf780a3354966fb2c25',
      color: '#C03B22',
      properties: [
        {
          content: '5bfbb1a0471dd0fc16ada146',
          _id: '68ed10e32bbc3dca9918f3c7',
          type: 'relationship',
          label: 'Relationship n-1',
          noLabel: false,
          required: false,
          showInCard: true,
          style: '',
          relationType: '68da99b961bceda4fe0d6ddd',
          inherit: {
            property: '68d6f62891b591b7432b2b4b',
            type: 'multiselect',
          },
          generatedId: false,
          name: 'relationship_n-1',
        },
      ],
      commonProperties: [
        {
          _id: '68ec5bf780a3354966fb2c27',
          label: 'Title',
          name: 'title',
          type: 'text',
          isCommonProperty: true,
        },
        {
          _id: '68ec5bf780a3354966fb2c28',
          label: 'Date added',
          name: 'creationDate',
          type: 'date',
          isCommonProperty: true,
        },
        {
          _id: '68ec5bf780a3354966fb2c29',
          label: 'Date modified',
          name: 'editDate',
          type: 'date',
          isCommonProperty: true,
        },
      ],
      entityViewPage: '',
      name: 'extra level',
      __v: 2,
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
      _id: '68d6ed4891b591b7432b276b',
      name: 'Verbs',
      values: [
        {
          label: 'Acknowledging',
          id: '765ab6ca-56a1-4948-9dc9-17fc0aa30843',
        },
        {
          label: 'Again',
          id: '9e22a1af-75d7-49a2-b9d8-9ec77939b630',
        },
        {
          label: 'Confirming',
          id: '240c244f-a736-4ad4-b777-e690e3ff78f0',
        },
        {
          label: 'Expressing',
          id: '6c744926-bf38-4f98-8c74-cf6b7280863c',
        },
        {
          label: 'grouped',
          values: [
            {
              label: 'verb1',
              id: 'e1b9944b-43ef-4989-837b-b3df79284b00',
            },
            {
              label: 'verb2',
              id: '8c418311-1244-4777-800a-65729b8c17a8',
            },
          ],
          id: '68979984-35ac-4b98-abf9-28eac857749c',
        },
      ],
      __v: 6,
    },
  ],
  currentUser: {
    _id: '58ada34d299e82674854510f',
    username: 'admin',
    email: 'admin@uwazi.com',
    __v: 1,
    role: 'admin',
    groups: [],
  },
};

export { rawEntity, processingContext };
