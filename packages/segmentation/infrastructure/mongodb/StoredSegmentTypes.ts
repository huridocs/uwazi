import { SegmentType } from '../../domain/SegmentType.js';

const STORED_BY_TYPE: Record<SegmentType, string> = {
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

const TYPE_BY_STORED = new Map(
  Object.entries(STORED_BY_TYPE).map(([type, stored]) => [stored, type as SegmentType])
);

/**
 * Segment types as Mongo stores them: the names the old pipeline copied from the service, kept so
 * existing records and not-yet-migrated readers stay valid. A missing type is the service's
 * default, text; an unknown one is `OTHER`.
 */
class StoredSegmentTypes {
  static toDomain(stored: string | undefined): SegmentType {
    if (stored === undefined) {
      return SegmentType.TEXT;
    }
    return TYPE_BY_STORED.get(stored) ?? SegmentType.OTHER;
  }

  static toStored(type: SegmentType): string {
    return STORED_BY_TYPE[type];
  }
}

export { StoredSegmentTypes };
