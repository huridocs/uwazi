import type {
  MetadataProperty,
  RelationshipMetadataProperty,
  SimpleMetadataProperty,
} from '#V2/formatters/types.js';
import type { ClientProperty } from '#V2/shared/types.js';
import {
  isLongField,
  isSpecializedFullWidthField,
  isLinkOnlyRelationship,
  isInheritingRelationship,
  LONG_FIELD_CHAR_THRESHOLD,
  COMPACT_METADATA_FIELD_LAYOUT,
  FULL_ROW_METADATA_FIELD_LAYOUT,
  metadataGridClassForProperty,
  partitionMetadataRecord,
} from '../metadataPropertyLayout';

const textField = (value: string, id = 't1'): SimpleMetadataProperty => ({
  _id: id,
  name: 'simple_text',
  label: 'Text',
  type: 'text',
  values: [{ value }],
});

const markdownField = (value: string): MetadataProperty => ({
  _id: 'm1',
  name: 'notes',
  label: 'Notes',
  type: 'markdown',
  values: [{ value }],
});

const geolocationField: MetadataProperty = {
  _id: 'g1',
  name: 'loc',
  label: 'Location',
  type: 'geolocation',
  values: [{ value: { latitude: 1, longitude: 2 } }],
};

const mediaField: MetadataProperty = {
  _id: 'med1',
  name: 'video',
  label: 'Video',
  type: 'media',
  values: [{ value: '/a.mp4' }],
};

const imageField: MetadataProperty = {
  _id: 'img1',
  name: 'photo',
  label: 'Photo',
  type: 'image',
  style: 'contain',
  values: [{ value: '/a.jpg', alt: 'a' }],
};

const previewField: MetadataProperty = {
  _id: 'prev1',
  name: 'preview',
  label: 'Preview',
  type: 'preview',
  style: 'cover',
  values: [{ value: '/p.jpg', alt: 'p' }],
};

const linkOnlyRel = (id = 'r1'): RelationshipMetadataProperty => ({
  _id: id,
  name: 'links',
  label: 'Links',
  type: 'relationship',
  mode: 'related',
  values: [{ _id: 'e1', title: 'Entity' }],
  inherited: false,
});

const inheritingRel: RelationshipMetadataProperty = {
  _id: 'r2',
  name: 'inherited_links',
  label: 'Inherited',
  type: 'relationship',
  mode: 'related',
  values: [{ _id: 'e2', title: 'Entity 2' }],
  inherited: true,
};

describe('metadataPropertyLayout', () => {
  it('treats geolocation, media, image, preview, and markdown as specialized full-width', () => {
    expect(isSpecializedFullWidthField(geolocationField)).toBe(true);
    expect(isSpecializedFullWidthField(mediaField)).toBe(true);
    expect(isSpecializedFullWidthField(imageField)).toBe(true);
    expect(isSpecializedFullWidthField(previewField)).toBe(true);
    expect(isSpecializedFullWidthField(markdownField('x'))).toBe(true);
    expect(isSpecializedFullWidthField(textField('short'))).toBe(false);
  });

  it('marks text longer than threshold or with newlines as long and never treats specialized types as long', () => {
    expect(isLongField(textField('short'))).toBe(false);
    expect(isLongField(textField('x'.repeat(LONG_FIELD_CHAR_THRESHOLD + 1)))).toBe(true);
    expect(isLongField(textField('line one\nline two'))).toBe(true);
    expect(isLongField(markdownField('x'.repeat(LONG_FIELD_CHAR_THRESHOLD + 1)))).toBe(false);
  });

  it('classifies relationships by inherited flag', () => {
    expect(isLinkOnlyRelationship(linkOnlyRel())).toBe(true);
    expect(isInheritingRelationship(linkOnlyRel())).toBe(false);
    expect(isLinkOnlyRelationship(inheritingRel)).toBe(false);
    expect(isInheritingRelationship(inheritingRel)).toBe(true);
  });

  it('packs short fields and images compact', () => {
    expect(metadataGridClassForProperty(textField('short'), undefined)).toBe(
      COMPACT_METADATA_FIELD_LAYOUT
    );
    expect(metadataGridClassForProperty(linkOnlyRel(), undefined)).toBe(
      COMPACT_METADATA_FIELD_LAYOUT
    );
    expect(metadataGridClassForProperty(imageField, undefined)).toBe(COMPACT_METADATA_FIELD_LAYOUT);
  });

  it('packs long text, markdown, geo, media, and fullWidth images full-row', () => {
    expect(metadataGridClassForProperty(imageField, { fullWidth: true, showInCard: true })).toBe(
      FULL_ROW_METADATA_FIELD_LAYOUT
    );
    expect(metadataGridClassForProperty(markdownField('md'), undefined)).toBe(
      FULL_ROW_METADATA_FIELD_LAYOUT
    );
    expect(metadataGridClassForProperty(geolocationField, undefined)).toBe(
      FULL_ROW_METADATA_FIELD_LAYOUT
    );
    expect(metadataGridClassForProperty(mediaField, undefined)).toBe(
      FULL_ROW_METADATA_FIELD_LAYOUT
    );
    expect(
      metadataGridClassForProperty({ ...textField('x'.repeat(160)), name: 'body' }, undefined)
    ).toBe(FULL_ROW_METADATA_FIELD_LAYOUT);
    expect(
      metadataGridClassForProperty({ ...textField('short'), name: 'summary' }, undefined)
    ).toBe(FULL_ROW_METADATA_FIELD_LAYOUT);
  });

  // eslint-disable-next-line max-statements
  it('puts link-only and template fields in masonry order and inheriting rels aside', () => {
    const short = textField('short', 'short1');
    const long = textField('x'.repeat(LONG_FIELD_CHAR_THRESHOLD + 1), 'long1');
    const showInCardText = textField('carded', 'card1');
    const templateProperties: ClientProperty[] = [
      { _id: 'short1', name: 'simple_text', type: 'text', label: 'Text' },
      { _id: 'long1', name: 'simple_text', type: 'text', label: 'Text' },
      { _id: 'card1', name: 'simple_text', type: 'text', label: 'Text', showInCard: true },
      { _id: 'prev1', name: 'preview', type: 'preview', label: 'Preview' },
      { _id: 'm1', name: 'notes', type: 'markdown', label: 'Notes' },
      { _id: 'img1', name: 'photo', type: 'image', label: 'Photo', showInCard: true },
      {
        _id: 'rel-card',
        name: 'links',
        type: 'relationship',
        label: 'Links',
        showInCard: true,
      },
      { _id: 'rel-detail', name: 'links', type: 'relationship', label: 'Links' },
    ];
    const templateMap = new Map<string, ClientProperty>();
    templateProperties.forEach(property => {
      if (typeof property._id === 'string') {
        templateMap.set(property._id, property);
      }
    });
    const linkCard = linkOnlyRel('rel-card');
    const linkDetail = linkOnlyRel('rel-detail');

    const withPreview = partitionMetadataRecord(
      [short, long, showInCardText, previewField, markdownField('md'), imageField],
      [linkCard, linkDetail, inheritingRel],
      templateMap
    );

    expect(withPreview.masonryFields.map(f => f._id)).toEqual([
      'short1',
      'long1',
      'card1',
      'prev1',
      'm1',
      'img1',
      'rel-card',
      'rel-detail',
    ]);
    expect(withPreview.inheritingRels.map(f => f._id)).toEqual(['r2']);

    const empty = partitionMetadataRecord([], [], new Map());
    expect(empty.masonryFields).toEqual([]);
    expect(empty.inheritingRels).toEqual([]);
  });

  it('omits empty specialized fields from masonry while keeping filled preview', () => {
    const emptyPreview: MetadataProperty = {
      _id: 'prev-empty',
      name: 'previewg',
      label: 'Previewg',
      type: 'preview',
      style: 'cover',
      values: [],
    };
    const emptyImage: MetadataProperty = {
      _id: 'img-empty',
      name: 'imaged',
      label: 'Imaged',
      type: 'image',
      style: 'contain',
      values: [{ value: '', alt: '' }],
    };
    const partition = partitionMetadataRecord(
      [emptyPreview, emptyImage, previewField, markdownField('md')],
      [],
      new Map()
    );

    expect(partition.masonryFields.map(f => f._id)).toEqual(['prev1', 'm1']);
  });
});
