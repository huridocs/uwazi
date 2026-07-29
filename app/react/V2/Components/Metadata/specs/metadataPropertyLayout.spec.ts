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
  metadataGridClassForProperty,
  COMPACT_METADATA_FIELD_LAYOUT,
  FULL_ROW_METADATA_FIELD_LAYOUT,
  partitionMetadataRecord,
  fieldShowsInCard,
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

  it('returns masonry grid classes for compact vs full-row fields', () => {
    expect(metadataGridClassForProperty(textField('short'), undefined)).toBe(
      COMPACT_METADATA_FIELD_LAYOUT
    );
    expect(metadataGridClassForProperty(markdownField('x'), undefined)).toBe(
      FULL_ROW_METADATA_FIELD_LAYOUT
    );
    expect(
      metadataGridClassForProperty(imageField, { fullWidth: true })
    ).toBe(FULL_ROW_METADATA_FIELD_LAYOUT);
  });

  it('reads showInCard from template property map', () => {
    const map = new Map<string, ClientProperty>([
      ['t1', { _id: 't1', name: 'simple_text', type: 'text', label: 'Text', showInCard: true }],
    ]);
    expect(fieldShowsInCard('t1', map)).toBe(true);
    expect(fieldShowsInCard('missing', map)).toBe(false);
  });

  it('partitions preview first, leading cards, details, and inheriting relationships exclusively', () => {
    const short = textField('short', 'short1');
    const long = textField('x'.repeat(LONG_FIELD_CHAR_THRESHOLD + 1), 'long1');
    const showInCardText = textField('carded', 'card1');
    const templateMap = new Map<string, ClientProperty>([
      [
        'card1',
        { _id: 'card1', name: 'simple_text', type: 'text', label: 'Text', showInCard: true },
      ],
      [
        'rel-card',
        {
          _id: 'rel-card',
          name: 'links',
          type: 'relationship',
          label: 'Links',
          showInCard: true,
        },
      ],
    ]);
    const linkCard = linkOnlyRel('rel-card');
    const linkDetail = linkOnlyRel('rel-detail');

    const withPreview = partitionMetadataRecord(
      [short, long, showInCardText, previewField, markdownField('md')],
      [linkCard, linkDetail, inheritingRel],
      templateMap,
      false
    );

    expect(withPreview.showDocumentPreview).toBe(true);
    expect(withPreview.previewField?._id).toBe('prev1');
    expect(withPreview.leadingFields.map(f => f._id).sort()).toEqual(['card1', 'long1', 'm1']);
    expect(withPreview.detailFields.map(f => f._id)).toEqual(['short1']);
    expect(withPreview.leadingLinkOnlyRels.map(f => f._id)).toEqual(['rel-card']);
    expect(withPreview.detailLinkOnlyRels.map(f => f._id)).toEqual(['rel-detail']);
    expect(withPreview.inheritingRels.map(f => f._id)).toEqual(['r2']);
    expect(withPreview.leadingFields.find(f => f._id === 'prev1')).toBeUndefined();
    expect(withPreview.detailFields.find(f => f._id === 'prev1')).toBeUndefined();

    const withDocOnly = partitionMetadataRecord([], [], new Map(), true);
    expect(withDocOnly.showDocumentPreview).toBe(true);
    expect(withDocOnly.previewField).toBeUndefined();
  });

  it('omits empty specialized fields from leading cards while keeping filled preview consumed', () => {
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
      new Map(),
      true
    );

    expect(partition.showDocumentPreview).toBe(true);
    expect(partition.previewField?._id).toBe('prev1');
    expect(partition.leadingFields.map(f => f._id)).toEqual(['m1']);
    expect(partition.leadingFields.find(f => f._id === 'prev-empty')).toBeUndefined();
    expect(partition.leadingFields.find(f => f._id === 'img-empty')).toBeUndefined();
  });
});
