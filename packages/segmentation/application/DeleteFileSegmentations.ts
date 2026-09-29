import { ArrayUtils } from '#api/common.v2/utils/Array.js';
import { AbstractUseCase } from '#api/core/libs/UseCase.js';
import { SegmentationDataSource } from './contracts/SegmentationDataSource.js';
import { SegmentationXmlStore } from './contracts/SegmentationXmlStore.js';

type Input = { fileIds: string[] };

type Deps = {
  segmentationDS: SegmentationDataSource;
  xmlStore: SegmentationXmlStore;
};

/** Deletes the segmentations of deleted files, and the xml each one kept. */
class DeleteFileSegmentations extends AbstractUseCase<Input, void, Deps> {
  async execute({ fileIds }: Input): Promise<void> {
    const deleted = await this.transactionManager.run(async () =>
      this.deps.segmentationDS.deleteByFileIds(fileIds)
    );

    const xmlFilenames = deleted.flatMap(segmentation =>
      segmentation.xmlFilename ? [segmentation.xmlFilename] : []
    );
    await ArrayUtils.sequentialFor(xmlFilenames, async xmlFilename =>
      this.deps.xmlStore.remove(xmlFilename)
    );
  }
}

export { DeleteFileSegmentations };
