import { ResultSet } from '#api/core/application/contracts/ResultSet.js';
import { Segmentation } from '../../domain/Segmentation.js';

export interface SegmentationDataSource {
  getSegmentations(documentIds: string[]): ResultSet<Segmentation>;
}
