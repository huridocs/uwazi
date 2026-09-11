import { z } from 'zod';
import { AbstractController } from '#api/common.v2/infrastructure/AbstractController.js';
import { TranslationServiceModuleFactory } from '../TranslationServiceModuleFactory.js';

const RequestSchema = z.object({
  text: z.string().trim().min(1),
  language_from: z.string().trim().min(1),
  language_to: z.string().trim().min(1),
});

type RequestBody = z.infer<typeof RequestSchema>;

class RequestTranslationController extends AbstractController<RequestBody> {
  async handle(): Promise<void> {
    const dto = RequestSchema.parse(this.request.body);

    this.ensureUser();

    const useCase = TranslationServiceModuleFactory.createRequestTranslation();
    const result = await useCase.execute(dto);

    this.response.status(200).json(result);
  }
}

export { RequestTranslationController };
