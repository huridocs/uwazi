import { InvalidDocumentLayout } from './errors/InvalidDocumentLayout.js';
import { SegmentType } from './SegmentType.js';

type LayoutSegmentProps = {
  left: number;
  top: number;
  width: number;
  height: number;
  pageNumber: number;
  text: string;
  type: SegmentType;
};

/** One typed region of a page: its box in page coordinates, the text inside it, and its kind. */
class LayoutSegment {
  readonly left: number;

  readonly top: number;

  readonly width: number;

  readonly height: number;

  readonly pageNumber: number;

  readonly text: string;

  readonly type: SegmentType;

  constructor(props: LayoutSegmentProps) {
    LayoutSegment.assertValid(props);

    this.left = props.left;
    this.top = props.top;
    this.width = props.width;
    this.height = props.height;
    this.pageNumber = props.pageNumber;
    this.text = props.text;
    this.type = props.type;
  }

  private static assertValid(props: LayoutSegmentProps) {
    if (!Number.isInteger(props.pageNumber) || props.pageNumber < 1) {
      throw new InvalidDocumentLayout(`segment page number ${props.pageNumber} is not a page`);
    }
    if (props.width < 0 || props.height < 0) {
      throw new InvalidDocumentLayout('segment dimensions cannot be negative');
    }
  }
}

export { LayoutSegment };
export type { LayoutSegmentProps };
