import { z } from 'zod';
import { AbstractController } from '#api/common.v2/infrastructure/AbstractController.js';
import { IdSchema } from '#api/core/libs/Id.js';
import type { DownloadFileSegmentationRequest } from '#shared/contracts/Segmentation.js';
import { DownloadFileSegmentationFactory } from '../factories/DownloadFileSegmentationFactory.js';
import { SegmentationWireMapper } from './SegmentationWireMapper.js';

const RequestSchema = z.object({
  params: z.object({ id: IdSchema }) satisfies z.ZodType<DownloadFileSegmentationRequest>,
});

class DownloadFileSegmentationController extends AbstractController {
  protected async handle(): Promise<void> {
    const {
      params: { id },
    } = RequestSchema.parse(this.request);

    const segmentation = await DownloadFileSegmentationFactory.default().execute({ fileId: id });
    this.jsonResponse(SegmentationWireMapper.toWire(segmentation));
  }
}

export { DownloadFileSegmentationController };
