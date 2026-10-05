import { z } from 'zod';
import { AbstractController } from '#api/common.v2/infrastructure/AbstractController.js';
import { GetOcrStatusFactory } from '../factories/GetOcrStatusFactory.js';
import { GetOcrStatusResponse } from './GetOcrStatusResponse.js';
import { OcrErrorResponder } from './OcrErrorResponder.js';
import { OcrStatusWireMapper } from './OcrStatusWireMapper.js';

const RequestSchema = z.object({ params: z.object({ filename: z.string().min(1) }) });

class OcrStatusController extends AbstractController {
  protected async handle(): Promise<void> {
    const {
      params: { filename },
    } = RequestSchema.parse(this.request);

    try {
      const status = await GetOcrStatusFactory.default().execute({ filename });
      const response: GetOcrStatusResponse = OcrStatusWireMapper.toWire(status);
      this.jsonResponse(response);
    } catch (error) {
      if (!OcrErrorResponder.respond(this.response, error)) {
        throw error;
      }
    }
  }
}

export { OcrStatusController };
