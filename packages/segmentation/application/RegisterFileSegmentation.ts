import { SettingsDataSource } from '#api/core/application/contracts/SettingsDataSource.js';
import { AbstractUseCase } from '#api/core/libs/UseCase.js';
import { Segmentation } from '../domain/Segmentation.js';
import { SegmentationDataSource } from './contracts/SegmentationDataSource.js';
import { SegmentationScheduler } from './SegmentationScheduler.js';

type Input = {
  fileId: string;
  filename: string;
  type?: string;
  mimetype?: string;
};

type Deps = {
  segmentationDS: SegmentationDataSource;
  settingsDS: SettingsDataSource;
  scheduler: SegmentationScheduler;
};

/**
 * Gives a newly created PDF document its segmentation. It starts idle; when the tenant has
 * segmentation on it is requested straight away, otherwise it waits for the feature to be
 * switched on. A file already registered is left as it is.
 */
class RegisterFileSegmentation extends AbstractUseCase<Input, void, Deps> {
  async execute(input: Input): Promise<void> {
    if (input.type !== 'document' || input.mimetype !== 'application/pdf') {
      return;
    }

    const segmentation = Segmentation.create({
      id: this.idGenerator.generate(),
      fileId: input.fileId,
      filename: input.filename,
    });

    await this.transactionManager.run(async () => {
      const created = await this.deps.segmentationDS.create(segmentation);
      if (created && (await this.deps.settingsDS.readFeature('segmentation'))) {
        await this.deps.scheduler.schedule([segmentation]);
      }
    });
  }
}

export { RegisterFileSegmentation };
export type { Input as RegisterFileSegmentationInput };
