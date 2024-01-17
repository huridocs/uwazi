/* eslint-disable max-len */
import { SearchResults } from '../csvExporter';

export const templates: any = {
  '58ad7d240d44252fee4e61fd': {
    _id: '58ad7d240d44252fee4e61fd',
    name: 'Comic character',
    properties: [
      {
        _id: '58ad7d240d44252fee4e6200',
        id: 'f6c30c8a-3013-471f-be8c-e639f6aeb031',
        name: 'company',
        type: 'text',
        label: 'company',
      },
      {
        _id: '58ad7d240d44252fee4e61ff',
        relationType: '5aae90e0bfbf88e5ae28b19e',
        id: '3780239a-f858-4df5-9dea-8ea4a59cfc9e',
        name: 'nemesis',
        content: '58ad7d240d44252fee4e61fb',
        type: 'relationship',
        label: 'Nemesis',
      },
      {
        _id: '61d5894c03be491b8b2c2937',
        relationType: '61d588f4263df5aa829ddb97',
        id: 'd0ab3a88-2e47-4991-9ac1-1b2273f9b766',
        name: 'location',
        content: '61d5891421eaff4de462c8ef',
        type: 'relationship',
        label: 'Location',
        inherit: {
          property: '5e0fdf2ad6ecbf60be14f095',
          type: 'geolocation',
        },
      },
      {
        _id: '61d5894c03be491b8b2c2937',
        relationType: '61d588f4263df5aa829ddb97',
        id: 'd0ab3a88-2e47-4991-9ac1-1b2273f9b765',
        name: 'country',
        content: '61d5891421eaff4de462c8ee',
        type: 'relationship',
        label: 'Country',
      },
      {
        _id: '5e3d19ccdeeb2652690a1258',
        label: 'Costume',
        type: 'select',
        content: '5e3d1853deeb2652690a0c10',
        showInCard: false,
        filter: false,
        name: 'costume',
        id: 'a5407e10-5148-4241-ad81-0c8fa78f1c43',
      },
      {
        _id: '58ad7d240d44252fee4e61fe',
        filter: true,
        id: '113d9a13-7fb9-447f-abf1-4075a9f8eb00',
        name: 'super_powers',
        content: '58ad7d240d44252fee4e6208',
        type: 'multiselect',
        label: 'Super powers',
      },
      {
        _id: '59859ad8ddb12b0ce6664927',
        relationType: '5a8480fac464318833d9b553',
        label: 'Allies',
        type: 'relationship',
        content: '58ad7d240d44252fee4e61fb',
        name: 'allies',
        id: 'c22326ac-6723-42b5-bb3e-de0fdcc2e2dc',
      },
      {
        nestedProperties: [],
        _id: '5e8f9509f16db8b791fec574',
        label: 'Geolocation',
        type: 'geolocation',
        name: 'geolocation_geolocation',
        id: 'e9b810a9-8f25-442f-b521-616f3f3bbcdd',
      },
      {
        _id: '60da5278f8b5527ea723d7cf',
        id: '465c107f-1c2d-4a93-a60d-849d1fc804c2',
        name: 'autoid',
        type: 'generatedid',
        label: 'AutoId',
      },
    ],
  },
  '58ad7d240d44252fee4e61fb': {
    _id: '58ad7d240d44252fee4e61fb',
    name: 'Super Villian',
    properties: [
      {
        _id: '5e3d1880deeb2652690a1036',
        label: 'Costume',
        type: 'select',
        content: '5e3d1853deeb2652690a0c10',
        name: 'costume',
        id: '53d6bb4a-2819-47b5-95a3-9261da5e8a69',
      },
      {
        _id: '58ad7d240d44252fee4e61fc',
        id: '58dd46d2-b52c-4e80-a859-6f4fadabe4c0',
        name: 'super_powers',
        content: '58ad7d240d44252fee4e6208',
        type: 'multiselect',
        label: 'Super powers',
      },
      {
        _id: '594bc3b0bee8b3829aea937f',
        relationType: '5aae90e0bfbf88e5ae28b1a3',
        label: 'Sidekick',
        type: 'relationship',
        content: '58f0aed2e147e720856a0741',
        name: 'sidekick',
        id: '0c45e6dc-0081-463e-9300-c46d13b1dcd2',
      },
      {
        _id: '594bc3b0bee8b3829aea937e',
        label: 'Planets conquered',
        type: 'numeric',
        name: 'planets_conquered',
        id: '6ec2c27a-ec30-4d0f-a7da-217a57e40ef2',
      },
      {
        _id: '594bc3b0bee8b3829aea937d',
        label: 'DOB',
        type: 'date',
        name: 'dob',
        id: '87289f51-21fb-4ff6-bb8d-8b7d66d86526',
      },
    ],
  },
};

export const searchResults: SearchResults = {
  rows: [
    {
      template: '58ad7d240d44252fee4e61fd',
      metadata: {
        nemesis: [{ icon: null, label: 'Thanos', type: 'entity', value: 'tf4laogfdcf8ncdi' }],
        location: [
          {
            icon: null,
            label: 'US',
            type: 'entity',
            inheritedValue: [
              {
                value: {
                  lat: 0.01,
                  lon: 37.02,
                  label: '',
                },
              },
            ],
            inheritedType: 'geolocation',
          },
        ],
        country: [
          {
            icon: null,
            label: 'Spain',
            type: 'entity',
            value: 'tf4laogfdcf8ncdi111111,',
            inheritedValue: [{ value: 'ES' }],
            inheritedType: 'text',
          },
        ],
        company: [{ value: 'Marvel' }],
        allies: [],
        costume: [],
        super_powers: [
          {
            label: 'tricky weapons',
            value: '017738a7-f8db-4274-81ac-c31ba3289bbb',
            parent: { label: 'equipment', value: 'equipment_id' },
          },
          {
            label: 'fly',
            value: 'b3eac310-8e9e-4adf-bd4c-13ed9f5765cb',
            parent: { label: 'ability', value: 'ability_id' },
          },
          {
            label: 'spaceship',
            value: 'spaceship_id',
            parent: { label: 'equipment', value: 'equipment_id' },
          },
        ],
        geolocation_geolocation: [
          { value: { lon: 2.154785156250431, label: '', lat: 45.974236866039696 } },
        ],
        autoid: [{ value: 'FTF8988-8015' }],
      },
      attachments: [
        {
          filename: '16636666131855z23xqq4fd8.csv',
        },
      ],
      documents: [
        {
          filename: '1483623310306rxeimbblc6u323xr.pdf',
        },
      ],
      sharedId: 'te3psdbg6tpj5rk9',
      published: true,
      title: 'Star Lord  Wikipedia',
      creationDate: 1483623310124,
      _id: '58ad7d250d44252fee4e62f4',
    },
    {
      template: '58ad7d240d44252fee4e61fb',
      metadata: {
        sidekick: [
          { icon: null, label: 'Man-bat', type: 'entity', value: 'twc5tsn02sw30evyyn6zuxr' },
        ],
        dob: [{ value: -892252800 }],
        planets_conquered: [{ value: 39 }],
        costume: [{ label: 'Black', value: 'yweji14e1za' }],
        super_powers: [
          { label: 'create chaos', value: '431ba419-5133-40d2-b0ac-0acddd2ada09' },
          {
            label: 'tricky weapons',
            value: '017738a7-f8db-4274-81ac-c31ba3289bbb',
            parent: { label: 'equipment', value: 'equipment_id' },
          },
        ],
      },
      attachments: [
        {
          filename: 'filename.pdf',
        },
      ],
      documents: [],
      sharedId: 'u3oxgkdp59n97ldi',
      published: true,
      title: 'Scarecrow',
      creationDate: 1483619177555,
      _id: '58ad7d250d44252fee4e62f0',
    },
  ],
  totalRows: 2,
  aggregations: {
    all: {
      _types: {
        buckets: [
          { key: 'missing', doc_count: 72, filtered: { doc_count: 0 } },
          { key: '58ad7d240d44252fee4e61fd', doc_count: 54, filtered: { doc_count: 1 } },
          { key: '58ad7d240d44252fee4e61fb', doc_count: 10, filtered: { doc_count: 1 } },
          { key: '58ad7d240d44252fee4e6201', doc_count: 4, filtered: { doc_count: 0 } },
          { key: '58f0aed2e147e720856a0741', doc_count: 2, filtered: { doc_count: 0 } },
          { key: '5a848088c464318833d9b542', doc_count: 2, filtered: { doc_count: 0 } },
          { key: '5a85a699cf8f4ac95570ae59', doc_count: 2, filtered: { doc_count: 0 } },
          { key: '5a85a6a2cf8f4ac95570ae60', doc_count: 2, filtered: { doc_count: 0 } },
          { key: '5a85a6accf8f4ac95570ae67', doc_count: 2, filtered: { doc_count: 0 } },
        ],
      },
    },
  },
};

export const csvExample = `Title,Date added,Template,company,Nemesis,Location,Country,Costume,Super powers,Allies,Geolocation,AutoId,Sidekick,Planets conquered,DOB,Documents,Attachments,Published
Star Lord  Wikipedia,2017-01-05,Comic character,Marvel,Thanos,"0.01|37.02",ES,,"ability<fly>|equipment<spaceship|tricky weapons>",,"45.974236866039696|2.154785156250431",FTF8988-8015,,,,/files/1483623310306rxeimbblc6u323xr.pdf,https://cejil.uwazi.io/api/files/16636666131855z23xqq4fd8.csv,Published
Scarecrow,2017-01-05,Super Villian,,,,,Black,"create chaos|equipment<tricky weapons>",,,,Man-bat,39,1941-09-23,,https://cejil.uwazi.io/api/files/filename.pdf,Published`;
