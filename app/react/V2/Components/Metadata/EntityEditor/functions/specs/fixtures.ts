import { Entity } from '#V2/api/entities/types.js';
import type { MetadataObjectSchema } from '#shared/types/commonTypes.js';
import type { FormMetadataProperty } from '../formatMetadataForForm.js';

type Fixtures = {
  property: FormMetadataProperty;
  expected: MetadataObjectSchema[];
};

const metadata: FormMetadataProperty[] = [
  { _id: 'p1', type: 'text', name: 'text_value', label: 'Text value' },
  { _id: 'p2', type: 'numeric', name: 'numeric_value', label: 'Numeric value' },
  { _id: 'p3', type: 'generatedid', name: 'generated_id', label: 'Generated ID' },
  { _id: 'p4', type: 'markdown', name: 'markdown_value', label: 'Markdown value' },
  { _id: 'p5', type: 'date', name: 'single_date', label: 'Single date' },
  { _id: 'p6', type: 'multidate', name: 'multiple_dates', label: 'Multiple dates' },
  { _id: 'p7', type: 'daterange', name: 'date_range', label: 'Date range' },
  {
    _id: 'p8',
    type: 'multidaterange',
    name: 'multiple_date_ranges',
    label: 'Multiple date ranges',
  },
  { _id: 'p9', type: 'select', name: 'status', label: 'Status', content: 'thesaurus-1' },
  {
    _id: 'p10',
    type: 'multiselect',
    name: 'tags',
    label: 'Tags',
    content: 'thesaurus-2',
  },
  {
    _id: 'p11',
    type: 'relationship',
    name: 'related_entities',
    label: 'Related entities',
    content: 'target-template',
  },
  { _id: 'p12', type: 'link', name: 'external_link', label: 'External link' },
  { _id: 'p13', type: 'geolocation', name: 'location', label: 'Location' },
  { _id: 'p14', type: 'image', name: 'image_file', label: 'Image file' },
  { _id: 'p15', type: 'preview', name: 'preview_file', label: 'Preview file' },
  { _id: 'p16', type: 'media', name: 'media_file', label: 'Media file' },
  {
    _id: 'p17',
    type: 'relationship',
    name: 'inherited_tags',
    label: 'Inherited tags',
    inherited: true,
    inheritedType: 'relationship',
    content: 'target-template',
  },
];

const entity: Entity = {
  _id: 'entity-1',
  language: 'en',
  mongoLanguage: 'en',
  sharedId: 'shared-entity-1',
  title: 'Entity with all metadata shapes',
  user: 'user',
  template: 'template-1',
  creationDate: 1704067200,
  metadata: {
    text_value: [{ value: 'Simple text value' }],
    numeric_value: [{ value: 42 }],
    generated_id: [{ value: 'AUTO-0001' }],
    markdown_value: [{ value: 'A paragraph with **bold** text.' }],
    single_date: [{ value: 1704067200 }],
    multiple_dates: [{ value: 1704067200 }, { value: 1704153600 }],
    date_range: [{ value: { from: 1704067200, to: 1704153600 } }],
    multiple_date_ranges: [
      { value: { from: 1704067200, to: 1704153600 } },
      { value: { from: 1704240000, to: 1704326400 } },
    ],
    status: [{ value: 'status.confirmed', label: 'Confirmed' }],
    tags: [
      { value: 'tag.root', label: 'Root tag' },
      {
        value: 'tag.child',
        label: 'Child tag',
        parent: { value: 'tag.group', label: 'Grouped tags' },
      },
    ],
    related_entities: [
      {
        value: 'shared-related-1',
        label: 'First related entity',
        type: 'entity',
        icon: { _id: 'icon-1', label: 'Flag', type: 'Flags' },
        inheritedType: 'multiselect',
        inheritedValue: [{ value: 'ignored', label: 'Ignored inherited value' }],
      },
      {
        value: 'shared-related-2',
        label: 'Second related entity',
        type: 'entity',
      },
    ],
    external_link: [{ value: { label: 'Documentation', url: 'https://example.org/docs' } }],
    location: [{ value: { lat: 40.7128, lon: -74.006, label: 'New York' } }],
    image_file: [{ value: '/uploads/image-file.png' }],
    preview_file: [{ value: '/uploads/preview-file.png' }],
    media_file: [
      {
        value:
          '(/uploads/media-file.mp4, {"timelinks":{"00:00:02":"First marker","00:00:05":"Second marker"}})',
      },
    ],
    inherited_tags: [
      {
        value: 'shared-parent',
        label: 'Parent entity',
        type: 'entity',
        inheritedType: 'multiselect',
        inheritedValue: [
          { value: 'nested.tag.1', label: 'Nested tag 1' },
          {
            value: 'nested.tag.2',
            label: 'Nested tag 2',
            parent: { value: 'nested.group', label: 'Nested group' },
          },
        ],
      },
    ],
  },
  documents: [],
};

const fixtures: Fixtures[] = [
  {
    property: metadata[0],
    expected: [{ value: 'Simple text value' }],
  },
  {
    property: metadata[1],
    expected: [{ value: 42 }],
  },
  {
    property: metadata[2],
    expected: [{ value: 'AUTO-0001' }],
  },
  {
    property: metadata[3],
    expected: [{ value: 'A paragraph with **bold** text.' }],
  },
  {
    property: metadata[4],
    expected: [{ value: 1704067200 }],
  },
  {
    property: metadata[5],
    expected: [{ value: 1704067200 }, { value: 1704153600 }],
  },
  {
    property: metadata[6],
    expected: [{ value: { from: 1704067200, to: 1704153600 } }],
  },
  {
    property: metadata[7],
    expected: [
      { value: { from: 1704067200, to: 1704153600 } },
      { value: { from: 1704240000, to: 1704326400 } },
    ],
  },
  {
    property: metadata[8],
    expected: [{ value: 'status.confirmed', label: 'Confirmed' }],
  },
  {
    property: metadata[9],
    expected: [
      { value: 'tag.root', label: 'Root tag' },
      {
        value: 'tag.child',
        label: 'Child tag',
        parent: { value: 'tag.group', label: 'Grouped tags' },
      },
    ],
  },
  {
    property: metadata[10],
    expected: [{ value: 'shared-related-1' }, { value: 'shared-related-2' }],
  },
  {
    property: metadata[11],
    expected: [{ value: { label: 'Documentation', url: 'https://example.org/docs' } }],
  },
  {
    property: metadata[12],
    expected: [{ value: { lat: 40.7128, lon: -74.006, label: 'New York' } }],
  },
  {
    property: metadata[13],
    expected: [{ value: '/uploads/image-file.png' }],
  },
  {
    property: metadata[14],
    expected: [{ value: '/uploads/preview-file.png' }],
  },
  {
    property: metadata[15],
    expected: [
      {
        value:
          '(/uploads/media-file.mp4, {"timelinks":{"00:00:02":"First marker","00:00:05":"Second marker"}})',
      },
    ],
  },
  {
    property: metadata[16],
    expected: [{ value: 'shared-parent' }],
  },
];

export { entity, fixtures };
export type { Fixtures };
