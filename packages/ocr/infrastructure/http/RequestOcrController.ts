import { z } from 'zod';
import { AbstractController } from '#api/common.v2/infrastructure/AbstractController.js';
import { RequestOcrFactory } from '../factories/RequestOcrFactory.js';
import { OcrErrorResponder } from './OcrErrorResponder.js';

const RequestSchema = z.object({ params: z.object({ filename: z.string().min(1) }) });

class RequestOcrController extends AbstractController {
  protected async handle(): Promise<void> {
    const {
      params: { filename },
    } = RequestSchema.parse(this.request);

    try {
      await RequestOcrFactory.default().execute({ filename });
      this.ok();
    } catch (error) {
      if (!OcrErrorResponder.respond(this.response, error)) {
        throw error;
      }
    }
  }
}

export { RequestOcrController };
