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

  // eslint-disable-next-line max-statements
  it('puts only showInCard fields first, details next, and image/media after details', () => {
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

    expect(withPreview.leadingFields.map(f => f._id)).toEqual(['card1', 'rel-card']);
    expect(withPreview.detailFields.map(f => f._id)).toEqual(['short1', 'long1', 'rel-detail']);
    expect(withPreview.trailingFields.map(f => f._id)).toEqual(['prev1', 'm1', 'img1']);
    expect(withPreview.inheritingRels.map(f => f._id)).toEqual(['r2']);

    const withDocOnly = partitionMetadataRecord([], [], new Map());
    expect(withDocOnly.leadingFields).toEqual([]);
    expect(withDocOnly.trailingFields).toEqual([]);
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
      new Map()
    );

    expect(partition.trailingFields.map(f => f._id)).toEqual(['prev1', 'm1']);
    expect(partition.leadingFields.find(f => f._id === 'prev-empty')).toBeUndefined();
    expect(partition.leadingFields.find(f => f._id === 'img-empty')).toBeUndefined();
    expect(partition.trailingFields.find(f => f._id === 'img-empty')).toBeUndefined();
  });
});
