import { Segmentation } from '../model/Segmentation';
import { SegmentationDBO } from './MongoFilesDataSource';

export class SegmentationMapper {
  static toDomain(dbo: SegmentationDBO): Segmentation {
    return {
      id: dbo._id.toString(),
      fileId: dbo.fileID.toString(),
      status: dbo.status!,
      filename: dbo.filename!,
      pageHeight: dbo.segmentation?.page_height,
      pageWidth: dbo.segmentation?.page_width,
      paragraphs: dbo.segmentation?.paragraphs?.map(item => ({
        height: item.height!,
        left: item.left!,
        pageNumber: item.page_number!,
        text: item.text!,
        top: item.top!,
        width: item.width!,
        type: item?.type!,
      })),
      autoExpire: dbo.autoexpire!,
      xmlname: dbo.xmlname,
    };
  }
}
