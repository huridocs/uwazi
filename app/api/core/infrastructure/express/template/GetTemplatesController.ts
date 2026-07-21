import { AbstractController } from '#api/common.v2/infrastructure/AbstractController.js';
import { TemplatesDAOFactory } from '#api/core/infrastructure/factories/TemplatesDAOFactory.js';
import { TemplateSchema } from '#shared/types/templateType.js';

type ResponseDto = {
  rows: TemplateSchema[];
};

class GetTemplatesController extends AbstractController {
  protected async handle(): Promise<void> {
    const dao = TemplatesDAOFactory.default();
    const templates = await dao.get();

    const response: ResponseDto = {
      rows: templates.map(template => ({ ...template, _id: template._id.toString() })),
    };

    this.response.json(response);
  }
}

export { GetTemplatesController };
