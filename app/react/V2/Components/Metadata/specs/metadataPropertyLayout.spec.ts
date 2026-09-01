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
  MEDIA_CARD_MIN_PX,
  PROPERTY_ROW_GAP_PX,
  metadataGridClassForProperty,
  partitionMetadataRecord,
  packPropertyRows,
  packClassForProperty,
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

  it('packs short fields, images, and media compact', () => {
    expect(metadataGridClassForProperty(linkOnlyRel(), undefined)).toBe(
      COMPACT_METADATA_FIELD_LAYOUT
    );
    expect(metadataGridClassForProperty(imageField, undefined)).toBe(COMPACT_METADATA_FIELD_LAYOUT);
    expect(metadataGridClassForProperty(mediaField, undefined)).toBe(COMPACT_METADATA_FIELD_LAYOUT);
    expect(metadataGridClassForProperty(previewField, undefined)).toBe(
      COMPACT_METADATA_FIELD_LAYOUT
    );
    expect(metadataGridClassForProperty(geolocationField, undefined)).toBe(
      COMPACT_METADATA_FIELD_LAYOUT
    );
  });

  it('packs long text and markdown full-row; media stays compact so it can share a row', () => {
    expect(metadataGridClassForProperty(imageField, { fullWidth: true, showInCard: true })).toBe(
      COMPACT_METADATA_FIELD_LAYOUT
    );
    expect(metadataGridClassForProperty(markdownField('md'), undefined)).toBe(
      FULL_ROW_METADATA_FIELD_LAYOUT
    );
    expect(
      metadataGridClassForProperty({ ...textField('x'.repeat(160)), name: 'body' }, undefined)
    ).toBe(FULL_ROW_METADATA_FIELD_LAYOUT);
    expect(
      metadataGridClassForProperty({ ...textField('short'), name: 'summary' }, undefined)
    ).toBe(COMPACT_METADATA_FIELD_LAYOUT);
  });

  it('packs inheriting relationships as full-row cards', () => {
    expect(metadataGridClassForProperty(inheritingRel, undefined)).toBe(
      FULL_ROW_METADATA_FIELD_LAYOUT
    );
    expect(packClassForProperty(inheritingRel, undefined)).toBe('block');
  });

  // eslint-disable-next-line max-statements
  it('puts inherit groups in masonry at the first inherited property', () => {
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
      'r2',
    ]);
    expect(withPreview.inheritingRels.map(f => f._id)).toEqual(['r2']);

    const empty = partitionMetadataRecord([], [], new Map());
    expect(empty.masonryFields).toEqual([]);
    expect(empty.inheritingRels).toEqual([]);
  });

  it('keeps one inherit group card at the first sibling in template order', () => {
    const first: RelationshipMetadataProperty = {
      ...inheritingRel,
      _id: 'inh-a',
      name: 'rel_a',
      label: 'Rel A',
    };
    const second: RelationshipMetadataProperty = {
      ...inheritingRel,
      _id: 'inh-b',
      name: 'rel_b',
      label: 'Rel B',
    };
    const later = textField('after', 'after1');
    const templateProperties: ClientProperty[] = [
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
    ];
    const templateMap = new Map(templateProperties.map(property => [property._id, property]));

    const partition = partitionMetadataRecord(
      [textField('ABC', 'short1'), later],
      [second, first],
      templateMap
    );

    expect(partition.masonryFields.map(f => f._id)).toEqual(['short1', 'inh-a', 'after1']);
    expect(partition.inheritingRels.map(f => f._id)).toEqual(['inh-a', 'inh-b']);
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

  it('classifies compact vs block content for packing', () => {
    expect(packClassForProperty(textField('1987'), undefined)).toBe('short');
    expect(
      packClassForProperty(
        { ...textField('x'.repeat(LONG_FIELD_CHAR_THRESHOLD + 1), 'mid'), type: 'numeric' },
        undefined
      )
    ).toBe('block');
    expect(packClassForProperty(imageField, undefined)).toBe('media');
    expect(packClassForProperty(mediaField, undefined)).toBe('media');
    expect(packClassForProperty(markdownField('md'), undefined)).toBe('block');
    expect(packClassForProperty(imageField, { fullWidth: true })).toBe('media');
    expect(packClassForProperty(geolocationField, undefined)).toBe('media');
  });

  const rowIds = (fields: MetadataProperty[], width: number) =>
    packPropertyRows(fields, width, new Map()).map(row => row.fields.map(f => f._id));

  it('puts one compact card per row when the panel is narrower than two cards', () => {
    expect(rowIds([textField('1987', 't1'), textField('ABC', 't2')], 300)).toEqual([
      ['t1'],
      ['t2'],
    ]);
  });

  it('puts one compact card per row when width is unknown', () => {
    expect(rowIds([textField('1987', 't1'), textField('ABC', 't2')], 0)).toEqual([['t1'], ['t2']]);
  });

  it('packs two then three media cards as the panel widens', () => {
    const twoCol = MEDIA_CARD_MIN_PX * 2 + PROPERTY_ROW_GAP_PX;
    const threeCol = MEDIA_CARD_MIN_PX * 3 + PROPERTY_ROW_GAP_PX * 2;
    expect(rowIds([imageField, mediaField], twoCol - 1)).toEqual([['img1'], ['med1']]);
    expect(rowIds([imageField, mediaField], twoCol)).toEqual([['img1', 'med1']]);
    expect(rowIds([imageField, mediaField, previewField], threeCol - 1)).toEqual([
      ['img1', 'med1'],
      ['prev1'],
    ]);
    expect(rowIds([imageField, mediaField, previewField], threeCol)).toEqual([
      ['img1', 'med1', 'prev1'],
    ]);
  });
  it('does not pack a short field with the following image', () => {
    expect(rowIds([textField('1987', 't1'), imageField, mediaField], 800)).toEqual([
      ['t1'],
      ['img1', 'med1'],
    ]);
  });

  it('packs consecutive media when they fit and flushes a block so it never shares a row', () => {
    const longNumeric: MetadataProperty = {
      ...textField('x'.repeat(LONG_FIELD_CHAR_THRESHOLD + 1), 't3'),
      type: 'numeric',
    };
    expect(
      rowIds(
        [
          textField('1987', 't1'),
          textField('ABC', 't2'),
          longNumeric,
          imageField,
          mediaField,
          markdownField('md'),
        ],
        800
      )
    ).toEqual([['t1', 't2'], ['t3'], ['img1', 'med1'], ['m1']]);
  });

  it('pairs image with media and preview with geolocation on a side pane and a wide pane', () => {
    const fields = [
      { ...markdownField('## Description'), _id: 'desc' },
      { ...markdownField('Articles 4, 5 and 7'), _id: 'articles' },
      textField('1987', 'body'),
      imageField,
      mediaField,
      previewField,
      geolocationField,
    ];
    const stacked = [['desc'], ['articles'], ['body'], ['img1'], ['med1'], ['prev1'], ['g1']];
    const two = [['desc'], ['articles'], ['body'], ['img1', 'med1'], ['prev1', 'g1']];
    const three = [['desc'], ['articles'], ['body'], ['img1', 'med1', 'prev1'], ['g1']];
    expect(rowIds(fields, 400)).toEqual(stacked);
    expect(rowIds(fields, 800)).toEqual(two);
    expect(rowIds(fields, 2560)).toEqual(three);
  });
});
