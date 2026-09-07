import type {
  MetadataProperty,
  PreviewMetadataProperty,
  ImageMetadataProperty,
} from '#V2/formatters/types.js';
import { buildTemplatePropertyById } from '../buildTemplatePropertyById.js';
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
  groupInheritingRelationships,
  inheritGroupKey,
} from '../metadataPropertyLayout';
import {
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
} from './metadataPropertyLayout.fixtures';

const rowIds = (fields: MetadataProperty[], width: number) =>
  packPropertyRows(fields, width).map(row => row.fields.map(f => f._id));

describe('metadataPropertyLayout', () => {
  describe('field classification', () => {
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

    it('classifies compact vs block content for packing', () => {
      expect(packClassForProperty(textField('1987'))).toBe('short');
      expect(
        packClassForProperty(numericField('x'.repeat(LONG_FIELD_CHAR_THRESHOLD + 1), 'mid'))
      ).toBe('block');
      expect(packClassForProperty(imageField)).toBe('media');
      expect(packClassForProperty(mediaField)).toBe('media');
      expect(packClassForProperty(previewField)).toBe('media');
      expect(packClassForProperty(markdownField('md'))).toBe('block');
      expect(packClassForProperty(geolocationField)).toBe('media');
    });
  });

  describe('grid classes', () => {
    it('packs short fields, images, and media compact', () => {
      expect(metadataGridClassForProperty(linkOnlyRel())).toBe(COMPACT_METADATA_FIELD_LAYOUT);
      expect(metadataGridClassForProperty(imageField)).toBe(COMPACT_METADATA_FIELD_LAYOUT);
      expect(metadataGridClassForProperty(mediaField)).toBe(COMPACT_METADATA_FIELD_LAYOUT);
      expect(metadataGridClassForProperty(previewField)).toBe(COMPACT_METADATA_FIELD_LAYOUT);
      expect(metadataGridClassForProperty(geolocationField)).toBe(COMPACT_METADATA_FIELD_LAYOUT);
      expect(COMPACT_METADATA_FIELD_LAYOUT).toContain('self-stretch');
      expect(COMPACT_METADATA_FIELD_LAYOUT).not.toContain('h-full');
    });

    it('packs long text and markdown full-row; media stays compact so it can share a row', () => {
      expect(metadataGridClassForProperty(imageField)).toBe(COMPACT_METADATA_FIELD_LAYOUT);
      expect(metadataGridClassForProperty(markdownField('md'))).toBe(
        FULL_ROW_METADATA_FIELD_LAYOUT
      );
      expect(metadataGridClassForProperty({ ...textField('x'.repeat(160)), name: 'body' })).toBe(
        FULL_ROW_METADATA_FIELD_LAYOUT
      );
      expect(metadataGridClassForProperty({ ...textField('short'), name: 'summary' })).toBe(
        COMPACT_METADATA_FIELD_LAYOUT
      );
    });

    it('packs inheriting relationships as full-row cards', () => {
      expect(metadataGridClassForProperty(inheritingRel)).toBe(FULL_ROW_METADATA_FIELD_LAYOUT);
      expect(packClassForProperty(inheritingRel)).toBe('block');
    });
  });

  describe('partitionMetadataRecord', () => {
    it('puts inherit groups in masonry at the first inherited property', () => {
      const templateMap = buildTemplatePropertyById(inheritGroupAtFirstPropertyTemplate());
      const withPreview = partitionMetadataRecord(
        [
          textField('short', 'short1'),
          textField('x'.repeat(LONG_FIELD_CHAR_THRESHOLD + 1), 'long1'),
          textField('carded', 'card1'),
          previewField,
          markdownField('md'),
          imageField,
        ],
        [linkOnlyRel('rel-card'), linkOnlyRel('rel-detail'), inheritingRel],
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
      expect(partitionMetadataRecord([], [], new Map())).toEqual({
        masonryFields: [],
        inheritingRels: [],
      });
    });

    it('keeps one inherit group card at the first sibling in template order', () => {
      const first = inheritingSibling('inh-a', 'rel_a', 'Rel A');
      const second = inheritingSibling('inh-b', 'rel_b', 'Rel B');
      const templateMap = inheritSiblingTemplateMap();
      const partition = partitionMetadataRecord(
        [textField('ABC', 'short1'), textField('after', 'after1')],
        [second, first],
        templateMap
      );
      expect(partition.masonryFields.map(f => f._id)).toEqual(['short1', 'inh-a', 'after1']);
      expect(partition.inheritingRels.map(f => f._id)).toEqual(['inh-a', 'inh-b']);
      const groups = groupInheritingRelationships([second, first], templateMap);
      expect(groups.size).toBe(1);
      expect(groups.get(inheritGroupKey(first, templateMap))?.map(field => field._id)).toEqual([
        'inh-b',
        'inh-a',
      ]);
    });

    it('omits empty specialized fields from masonry while keeping filled preview', () => {
      const emptyPreview: PreviewMetadataProperty = {
        _id: 'prev-empty',
        name: 'previewg',
        label: 'Previewg',
        type: 'preview',
        style: 'cover',
        values: [],
      };
      const emptyImage: ImageMetadataProperty = {
        _id: 'img-empty',
        name: 'imaged',
        label: 'Imaged',
        type: 'image',
        style: 'contain',
        values: [{ value: '', alt: '' }],
      };
      expect(
        partitionMetadataRecord(
          [emptyPreview, emptyImage, previewField, markdownField('md')],
          [],
          new Map()
        ).masonryFields.map(f => f._id)
      ).toEqual(['prev1', 'm1']);
    });
  });

  describe('packPropertyRows', () => {
    it('puts one compact card per row when the panel is narrower than two cards', () => {
      expect(rowIds([textField('1987', 't1'), textField('ABC', 't2')], 300)).toEqual([
        ['t1'],
        ['t2'],
      ]);
    });

    it('puts one compact card per row when width is unknown', () => {
      expect(rowIds([textField('1987', 't1'), textField('ABC', 't2')], 0)).toEqual([
        ['t1'],
        ['t2'],
      ]);
    });

    it('packs two media cards when they fit', () => {
      const twoCol = MEDIA_CARD_MIN_PX * 2 + PROPERTY_ROW_GAP_PX;
      expect(rowIds([imageField, mediaField], twoCol - 1)).toEqual([['img1'], ['med1']]);
      expect(rowIds([imageField, mediaField], twoCol)).toEqual([['img1', 'med1']]);
    });

    it('packs three media cards when they fit', () => {
      const threeCol = MEDIA_CARD_MIN_PX * 3 + PROPERTY_ROW_GAP_PX * 2;
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
      expect(
        rowIds(
          [
            textField('1987', 't1'),
            textField('ABC', 't2'),
            numericField('x'.repeat(LONG_FIELD_CHAR_THRESHOLD + 1), 't3'),
            imageField,
            mediaField,
            markdownField('md'),
          ],
          800
        )
      ).toEqual([['t1', 't2'], ['t3'], ['img1', 'med1'], ['m1']]);
    });

    it('stacks media on a narrow pane', () => {
      expect(
        rowIds(
          [
            markdownField('## Description', 'desc'),
            markdownField('Articles 4, 5 and 7', 'articles'),
            textField('1987', 'body'),
            imageField,
            mediaField,
            previewField,
            geolocationField,
          ],
          400
        )
      ).toEqual([['desc'], ['articles'], ['body'], ['img1'], ['med1'], ['prev1'], ['g1']]);
    });

    it('pairs image with media and preview with geolocation at 800px', () => {
      expect(
        rowIds(
          [
            markdownField('## Description', 'desc'),
            markdownField('Articles 4, 5 and 7', 'articles'),
            textField('1987', 'body'),
            imageField,
            mediaField,
            previewField,
            geolocationField,
          ],
          800
        )
      ).toEqual([['desc'], ['articles'], ['body'], ['img1', 'med1'], ['prev1', 'g1']]);
    });

    it('packs three media then leftover geo on a wide pane', () => {
      expect(
        rowIds(
          [
            markdownField('## Description', 'desc'),
            markdownField('Articles 4, 5 and 7', 'articles'),
            textField('1987', 'body'),
            imageField,
            mediaField,
            previewField,
            geolocationField,
          ],
          2560
        )
      ).toEqual([['desc'], ['articles'], ['body'], ['img1', 'med1', 'prev1'], ['g1']]);
    });
  });
});
