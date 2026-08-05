import { z } from 'zod';
import { AbstractController } from '#api/common.v2/infrastructure/AbstractController.js';
import { DeleteThesaurusUseCaseFactory } from '../../factories/DeleteThesaurusUseCaseFactory.js';

const RequestSchema = z.object({
  _id: z.string().min(1),
});

class DeleteThesaurusController extends AbstractController {
  protected async handle(): Promise<void> {
    const useCase = DeleteThesaurusUseCaseFactory.default();
    const { _id: thesaurusId } = RequestSchema.parse(this.request.query);

    await useCase.execute({ thesaurusId });

    this.response.json({ ok: true, _id: thesaurusId });
    this.request.sockets.emitToCurrentTenant('thesauriDelete', { ok: true, _id: thesaurusId });
  }
}

export { DeleteThesaurusController };
