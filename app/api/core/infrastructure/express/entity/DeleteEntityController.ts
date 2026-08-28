import { z } from 'zod';
import { AbstractController } from '#api/common.v2/infrastructure/AbstractController.js';
import { BulkDeleteEntityUseCaseFactory } from '../../factories/BulkDeleteEntityUseCaseFactory.js';

const RequestSchema = z.object({
  sharedId: z.string().trim().min(1, 'sharedId is required'),
});

type RequestDto = z.infer<typeof RequestSchema>;

class DeleteEntityController extends AbstractController<RequestDto> {
  protected async handle(): Promise<void> {
    const { sharedId } = RequestSchema.parse(this.request.query);

    const useCase = BulkDeleteEntityUseCaseFactory.default();

    await useCase.execute({ sharedIds: [sharedId] });

    this.response.json([]);
  }
}

export { DeleteEntityController };
