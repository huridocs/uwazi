import { z } from 'zod';
import {
  AbstractController,
  Dependencies as AbstractControllerDependencies,
} from 'api/common.v2/infrastructure/AbstractController';
import { TrainingSetFactory } from '../infrastructure/TrainingSetFactory';

type Dependencies = AbstractControllerDependencies<Request>;

const RequestSchema = z
  .object({
    extractorId: z.string({ message: 'You should provide an Extractor' }),
    suggestionIds: z
      .array(z.string({ message: 'You should provide a Suggestion' }), {
        message: 'You should provide at least one Suggestion',
      })
      .min(1, { message: 'You should provide at least one Suggestion' }),
    useForTraining: z.boolean().default(true).optional(),
  })
  .strict();

type Request = z.infer<typeof RequestSchema>;

class TrainingSetController extends AbstractController<Request> {
  constructor(dependencies: Dependencies) {
    super(dependencies);
  }

  async handle(): Promise<void> {
    const dto = RequestSchema.parse(this.request.body);
    this.ensureUser();
    const useCase = TrainingSetFactory.createUseCase();
    const result = await useCase.execute({
      extractorId: dto.extractorId,
      suggestionIds: dto.suggestionIds,
      useForTraining: dto.useForTraining ?? true,
    });

    this.jsonResponse(result);
  }
}

export { TrainingSetController };
