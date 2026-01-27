import { getConnection } from 'api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant';
import { AbstractController } from 'api/common.v2/infrastructure/AbstractController';
import { ThesaurusNotFoundError } from 'api/core/domain/thesaurus/errors';
import { TemplateDBO } from 'api/core/infrastructure/mongodb/template/DBOs/TemplateDBO';
import { ObjectId } from 'mongodb';
import { ThesaurusSchema } from 'shared/types/thesaurusType';
import { z } from 'zod';
import { TimedMethod } from 'api/core/libs/logger/infrastructure/decorators';

const RequestSchema = z.object({
  _id: z.string({ message: 'You should provide an Id' }),
});

type RequestDto = z.infer<typeof RequestSchema>;

type ResponseDto = number;

class CountTemplatesByThesaurusController extends AbstractController<RequestDto> {
  @TimedMethod('count_templates_by_thesaurus')
  protected async handle(): Promise<void> {
    const requestDto = RequestSchema.parse(this.request.query);
    const db = getConnection();
    const templatesCol = db.collection<TemplateDBO>('templates');
    const thesauriCol = db.collection<ThesaurusSchema>('dictionaries');

    const exists = await thesauriCol.findOne({ _id: ObjectId.createFromHexString(requestDto._id) });
    if (!exists) {
      throw new ThesaurusNotFoundError(requestDto._id);
    }

    const count = await templatesCol.countDocuments({ 'properties.content': requestDto._id });

    const responseDto: ResponseDto = count;

    this.response.json(responseDto);
  }
}

export { CountTemplatesByThesaurusController };
