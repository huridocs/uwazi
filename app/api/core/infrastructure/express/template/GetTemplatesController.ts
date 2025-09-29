import { AbstractController } from 'api/common.v2/infrastructure/AbstractController';
import { TemplateDBO } from 'api/templates.v2/database/schemas/TemplateDBO';
import { Application } from 'express';
import { TemplatesQueryService } from '../../mongodb/template/TemplatesQueryService';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
type RequestDto = void;

type ResponseDto = {
  rows: TemplateDBO[];
};

class GetTemplatesController extends AbstractController {
  static register(app: Application): void {
    app.get('/api/templates', this.createHandler());
  }

  protected async handle(): Promise<void> {
    const queryService = new TemplatesQueryService();

    const templates = await queryService.collection.find().toArray();

    const response: ResponseDto = { rows: templates };

    this.response.json(response);
  }
}

export { GetTemplatesController };
