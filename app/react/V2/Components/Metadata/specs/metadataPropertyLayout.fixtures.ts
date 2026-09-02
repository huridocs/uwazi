import type {
  GeolocationMetadataProperty,
  ImageMetadataProperty,
  MediaMetadataProperty,
  PreviewMetadataProperty,
  RelatedRelationshipMetadataProperty,
  SimpleMetadataProperty,
} from '#V2/formatters/types.js';
import type { ClientProperty } from '#V2/shared/types.js';
import { buildTemplatePropertyById } from '../buildTemplatePropertyById.js';

const textField = (value: string, id = 't1'): SimpleMetadataProperty => ({
  _id: id,
  name: 'simple_text',
  label: 'Text',
  type: 'text',
  values: [{ value }],
});

const markdownField = (value: string, id = 'm1'): SimpleMetadataProperty => ({
  _id: id,
  name: 'notes',
  label: 'Notes',
  type: 'markdown',
  values: [{ value }],
});

const numericField = (value: string, id: string): SimpleMetadataProperty => ({
  _id: id,
  name: 'simple_text',
  label: 'Text',
  type: 'numeric',
  values: [{ value }],
});

const geolocationField: GeolocationMetadataProperty = {
  _id: 'g1',
  name: 'loc',
  label: 'Location',
  type: 'geolocation',
  values: [{ value: { latitude: 1, longitude: 2 } }],
};

const mediaField: MediaMetadataProperty = {
  _id: 'med1',
  name: 'video',
  label: 'Video',
  type: 'media',
  values: [{ value: '/a.mp4' }],
};

const imageField: ImageMetadataProperty = {
  _id: 'img1',
  name: 'photo',
  label: 'Photo',
  type: 'image',
  style: 'contain',
  values: [{ value: '/a.jpg', alt: 'a' }],
};

const previewField: PreviewMetadataProperty = {
  _id: 'prev1',
  name: 'preview',
  label: 'Preview',
  type: 'preview',
  style: 'cover',
  values: [{ value: '/p.jpg', alt: 'p' }],
};

const linkOnlyRel = (id = 'r1'): RelatedRelationshipMetadataProperty => ({
  _id: id,
  name: 'links',
  label: 'Links',
  type: 'relationship',
  mode: 'related',
  values: [{ _id: 'e1', title: 'Entity' }],
  inherited: false,
});

const inheritingRel: RelatedRelationshipMetadataProperty = {
  _id: 'r2',
  name: 'inherited_links',
  label: 'Inherited',
  type: 'relationship',
  mode: 'related',
  values: [{ _id: 'e2', title: 'Entity 2' }],
  inherited: true,
};

const inheritGroupAtFirstPropertyTemplate = (): ClientProperty[] => [
  { _id: 'short1', name: 'simple_text', type: 'text', label: 'Text' },
  { _id: 'long1', name: 'simple_text', type: 'text', label: 'Text' },
  { _id: 'card1', name: 'simple_text', type: 'text', label: 'Text', showInCard: true },
  { _id: 'prev1', name: 'preview', type: 'preview', label: 'Preview' },
  { _id: 'm1', name: 'notes', type: 'markdown', label: 'Notes' },
  { _id: 'img1', name: 'photo', type: 'image', label: 'Photo', showInCard: true },
  { _id: 'rel-card', name: 'links', type: 'relationship', label: 'Links', showInCard: true },
  { _id: 'rel-detail', name: 'links', type: 'relationship', label: 'Links' },
];

const inheritSiblingTemplateMap = () =>
  buildTemplatePropertyById([
    { _id: 'short1', name: 'code', type: 'text', label: 'Code' },
    {
      _id: 'inh-a',
      name: 'rel_a',
      type: 'relationship',
      label: 'Rel A',
      content: 'related-tmpl',
      relationType: 'rel-type-1',
      inherit: { property: 'p1', type: 'text' },
    },
    {
      _id: 'inh-b',
      name: 'rel_b',
      type: 'relationship',
      label: 'Rel B',
      content: 'related-tmpl',
      relationType: 'rel-type-1',
      inherit: { property: 'p2', type: 'geolocation' },
    },
    { _id: 'after1', name: 'after', type: 'text', label: 'After' },
  ]);

const inheritingSibling = (
  id: string,
  name: string,
  label: string
): RelatedRelationshipMetadataProperty => ({
  ...inheritingRel,
  _id: id,
  name,
  label,
});

export {
  textField,
  markdownField,
  numericField,
  geolocationField,
  mediaField,
  imageField,
  previewField,
  linkOnlyRel,
  inheritingRel,
  inheritGroupAtFirstPropertyTemplate,
  inheritSiblingTemplateMap,
  inheritingSibling,
};
