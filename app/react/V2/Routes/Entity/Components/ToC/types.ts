import { TocSchema } from '#shared/types/commonTypes.js';

export type ProcessedTocEntry = {
  entry: TocSchema;
  index: number; // Sorted index (for display and internal logic)
  originalIndex: number; // Original index in the toc array (for callbacks)
  indentation: number;
  topIndex: number;
  isTopLevel: boolean;
};
