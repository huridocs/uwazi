import { z } from 'zod';
import { AbstractController } from '#api/common.v2/infrastructure/AbstractController.js';
import { DownloadFileSegmentationFactory } from '../factories/DownloadFileSegmentationFactory.js';
import { SegmentationWireMapper } from './SegmentationWireMapper.js';

const requestSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[a-fA-F0-9]{24}$/),
  }),
});

class DownloadFileSegmentationController extends AbstractController {
  protected async handle(): Promise<void> {
    const {
      params: { id },
    } = requestSchema.parse(this.request);

    const segmentation = await DownloadFileSegmentationFactory.default().execute({ fileId: id });
    this.jsonResponse(SegmentationWireMapper.toWire(segmentation));
  }
}

export { DownloadFileSegmentationController };
