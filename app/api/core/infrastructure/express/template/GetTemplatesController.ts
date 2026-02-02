import { AbstractController } from '#api/common.v2/infrastructure/AbstractController.js';
import { TemplateDBO } from '../../mongodb/template/DBOs/TemplateDBO.js';
import { getConnection } from '../../mongodb/common/getConnectionForCurrentTenant.js';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
type RequestDto = void;

type ResponseDto = {
  rows: TemplateDBO[];
};

class GetTemplatesController extends AbstractController {
  protected async handle(): Promise<void> {
    const db = getConnection();
    const templatesCol = db.collection<TemplateDBO>('templates');

    const templates = await templatesCol.find().toArray();

    const response: ResponseDto = { rows: templates };

    this.response.json(response);
  }
}

export { GetTemplatesController };
