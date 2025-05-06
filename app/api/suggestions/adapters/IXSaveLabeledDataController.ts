import { z } from 'zod';
import {
  AbstractController,
  Dependencies as AbstractControllerDependencies,
} from 'api/common.v2/infrastructure/AbstractController';
import { IXSaveLabeledDataFactory } from '../infrastructure/IXSaveLabeledDataFactory';

const RequestSchema = z.object({
  extractorId: z.string({ message: 'You should provide an Extractor ID' }),
  sourceId: z.string({ message: 'You should provide a Source ID' }),
  labeledData: z.object({
    propertyID: z.string(),
    name: z.string(),
    timestamp: z.string(),
    deleteSelection: z.boolean(),
    selection: z.object({
      text: z.string(),
      selectionRectangles: z.array(
        z.object({
          top: z.number(),
          left: z.number(),
          width: z.number(),
          height: z.number(),
          page: z.string(),
        })
      ),
    }),
  }),
});

type Request = z.infer<typeof RequestSchema>;
type Response = { success: boolean };

type Dependencies = AbstractControllerDependencies<Request>;

class IXSaveLabeledDataController extends AbstractController<Request> {
  constructor(dependencies: Dependencies) {
    super(dependencies);
  }

  protected async handle(): Promise<void> {
    const dto = RequestSchema.parse(this.request.body);

    this.ensureUser();

    const useCase = IXSaveLabeledDataFactory.createDefault();

    await useCase.execute({
      ...dto,
      language: this.language,
    });

    const response: Response = { success: true };
    this.jsonResponse(response);
  }
}

export { IXSaveLabeledDataController };
export type { Request, Response };
