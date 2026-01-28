import { AbstractController } from 'api/common.v2/infrastructure/AbstractController';
import { TemplateDBO } from 'api/core/infrastructure/mongodb/template/DBOs/TemplateDBO';
import { getConnection } from 'api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant';
import { TimedMethod } from 'api/core/libs/logger/TimedMethodDecorator';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
type RequestDto = void;

type ResponseDto = {
  rows: TemplateDBO[];
};

class GetTemplatesController extends AbstractController {
  @TimedMethod('get_templates')
  protected async handle(): Promise<void> {
    const db = getConnection();
    const templatesCol = db.collection<TemplateDBO>('templates');

    const templates = await templatesCol.find().toArray();

    const response: ResponseDto = { rows: templates };

    this.response.json(response);
  }
}

export { GetTemplatesController };
