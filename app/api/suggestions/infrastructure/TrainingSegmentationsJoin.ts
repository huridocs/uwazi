import { ObjectId } from 'mongodb';
import { SegmentationDirectory } from '#segmentation';
import { IXSegmentation } from '#api/services/informationextraction/IXSegmentation.js';
import { TrainingFileRow } from '../domain/IXTrainingMaterialsQueryService.js';

type RowToJoin = Omit<TrainingFileRow, 'segmentation' | 'fileId'> & { fileId: ObjectId | string };

const BATCH_SIZE = 50;

/**
 * Joins the training walk's rows to their file's ready segmentation, which the segmentation
 * module owns, one directory read per batch of rows. A row whose file has none drops out: that is
 * how an unsegmented document is kept out of a training run.
 */
class TrainingSegmentationsJoin {
  constructor(private readonly deps: { segmentationDirectory: SegmentationDirectory }) {}

  async *join(rows: AsyncIterable<RowToJoin>): AsyncGenerator<TrainingFileRow> {
    let batch: RowToJoin[] = [];

    for await (const row of rows) {
      batch.push(row);
      if (batch.length >= BATCH_SIZE) {
        yield* this.withSegmentations(batch);
        batch = [];
      }
    }

    yield* this.withSegmentations(batch);
  }

  private async *withSegmentations(batch: RowToJoin[]): AsyncGenerator<TrainingFileRow> {
    if (!batch.length) {
      return;
    }

    const ready = await this.deps.segmentationDirectory.readyByFileIds(
      batch.map(row => String(row.fileId))
    );
    const byFile = new Map(ready.map(found => [found.fileId, IXSegmentation.fromReadModel(found)]));

    for (const row of batch) {
      const segmentation = byFile.get(String(row.fileId));
      if (segmentation) {
        yield { ...row, fileId: new ObjectId(String(row.fileId)), segmentation };
      }
    }
  }
}

export { TrainingSegmentationsJoin };
