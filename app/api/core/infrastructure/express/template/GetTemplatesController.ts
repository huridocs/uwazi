import { AbstractController } from '#api/common.v2/infrastructure/AbstractController.js';
import { TemplatesDAOFactory } from '#api/core/infrastructure/factories/TemplatesDAOFactory.js';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
type RequestDto = void;

type ResponseDto = {
  rows: any[];
};

class GetTemplatesController extends AbstractController {
  protected async handle(): Promise<void> {
    const dao = TemplatesDAOFactory.default();
    const templates = await dao.get();

    const response: ResponseDto = { rows: templates };

    this.response.json(response);
  }
}

export { GetTemplatesController };
