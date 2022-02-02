/* eslint-disable */
/**AUTO-GENERATED. RUN yarn emit-types to update.*/

import { ObjectIdSchema } from 'shared/types/commonTypes';

export interface SegmentationType {
  _id?: ObjectIdSchema;
  autoexpire?: number | null;
  fileID?: ObjectIdSchema;
  filename?: string;
  xmlname?: string;
  status?: 'processing' | 'failed' | 'ready';
  segmentation?: {
    page_width?: number;
    page_height?: number;
    paragraphs?: {
      left?: number;
      top?: number;
      width?: number;
      height?: number;
      page_number?: number;
      text?: string;
    }[];
  };
}
