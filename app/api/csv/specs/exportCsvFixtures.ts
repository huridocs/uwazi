/* eslint-disable max-len */
import { SearchResults } from '../csvExporter';

export const searchResults: SearchResults = {
  rows: [
    {
      template: '58ad7d240d44252fee4e61fd',
      metadata: {
        nemesis: [{ icon: null, label: 'Thanos', type: 'entity', value: 'tf4laogfdcf8ncdi' }],
        company: [{ value: 'Marvel' }],
        allies: [],
        costume: [],
        super_powers: [
          { label: 'tricky weapons', value: '017738a7-f8db-4274-81ac-c31ba3289bbb' },
          { label: 'fly', value: 'b3eac310-8e9e-4adf-bd4c-13ed9f5765cb' },
        ],
        geolocation_geolocation: [
          { value: { lon: 2.154785156250431, label: '', lat: 45.974236866039696 } },
        ],
      },
      attachments: [],
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
          { label: 'tricky weapons', value: '017738a7-f8db-4274-81ac-c31ba3289bbb' },
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

export const csvExample = `Title,Creation date,Template,company,Nemesis,Costume,Super powers,Allies,Sidekick,Planets conquered,DOB,Geolocation,Documents,Attachments,Published
Star Lord  Wikipedia,172017-01-05,Comic character,Marvel,Thanos,,"tricky weapons|fly",,,,,"45.974236866039696|2.154785156250431",/files/1483623310306rxeimbblc6u323xr.pdf,,Published
Scarecrow,172017-01-05,Super Villian,,,Black,"create chaos|tricky weapons",,Man-bat,39,411941-09-22,,,/api/attachments/download?_id=58ad7d250d44252fee4e62f0&file=filename.pdf,Published`;
