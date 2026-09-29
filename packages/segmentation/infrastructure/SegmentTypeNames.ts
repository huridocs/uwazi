import { SegmentType } from '../domain/SegmentType.js';

const NAME_BY_TYPE: Record<SegmentType, string> = {
  [SegmentType.TEXT]: 'Text',
  [SegmentType.TITLE]: 'Title',
  [SegmentType.SECTION_HEADER]: 'Section header',
  [SegmentType.LIST_ITEM]: 'List item',
  [SegmentType.TABLE]: 'Table',
  [SegmentType.PICTURE]: 'Picture',
  [SegmentType.CAPTION]: 'Caption',
  [SegmentType.FORMULA]: 'Formula',
  [SegmentType.FOOTNOTE]: 'Footnote',
  [SegmentType.PAGE_HEADER]: 'Page header',
  [SegmentType.PAGE_FOOTER]: 'Page footer',
  [SegmentType.OTHER]: 'Other',
};

const TYPE_BY_NAME = new Map(
  Object.entries(NAME_BY_TYPE).map(([type, name]) => [name, type as SegmentType])
);

/**
 * Segment types under the names HURIDOCS' ML services use for them — the layout analysis service
 * that produces them, and the metadata and paragraph extraction services that are sent them. The
 * old pipeline stored and served these names as they came, so Mongo records and the segmentation
 * endpoint keep them too. A missing name is the services' default, text; an unknown one is `OTHER`.
 */
class SegmentTypeNames {
  static toType(name: string | undefined): SegmentType {
    if (name === undefined) {
      return SegmentType.TEXT;
    }
    return TYPE_BY_NAME.get(name) ?? SegmentType.OTHER;
  }

  static toName(type: SegmentType): string {
    return NAME_BY_TYPE[type];
  }
}

export { SegmentTypeNames };
