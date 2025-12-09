import { TocSchema } from 'shared/types/commonTypes';

export type ProcessedTocEntry = {
  entry: TocSchema;
  index: number;
  indentation: number;
  topIndex: number;
  isTopLevel: boolean;
};
