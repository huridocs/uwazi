import { ObjectId } from 'mongodb';
import { ParagraphSchema, SegmentationType } from 'shared/types/segmentationType';

type Props = SegmentationType;

export class MongoSegmentationBuilder {
  private constructor(private props: Props) {}

  static create() {
    return new MongoSegmentationBuilder({
      _id: new ObjectId(),
      status: 'ready',
      segmentation: {
        page_height: 0,
        page_width: 0,
        paragraphs: [],
      },
      xmlname: 'default.txt',
    });
  }

  withId(id: ObjectId) {
    this.props._id = id;

    return this;
  }

  withParagraph(paragraph: ParagraphSchema) {
    this.props.segmentation?.paragraphs?.push(paragraph);

    return this;
  }

  withStatus(status: Props['status']) {
    this.props.status = status;

    return this;
  }

  withFileId(id: ObjectId) {
    this.props.fileID = id;

    return this;
  }

  build(): SegmentationType {
    return { ...this.props };
  }
}
