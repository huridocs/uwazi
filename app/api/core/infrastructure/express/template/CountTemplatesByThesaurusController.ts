import { AbstractController } from '#api/common.v2/infrastructure/AbstractController.js';
import { ThesaurusNotFoundError } from '#api/core/domain/thesaurus/errors.js';
import { ObjectId } from 'mongodb';
import { ThesaurusSchema } from '#shared/types/thesaurusType.js';
import { z } from 'zod';
import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { TemplatesDAOFactory } from '#api/core/infrastructure/factories/TemplatesDAOFactory.js';

const RequestSchema = z.object({
  _id: z.string({ message: 'You should provide an Id' }),
});

type RequestDto = z.infer<typeof RequestSchema>;

type ResponseDto = number;

class CountTemplatesByThesaurusController extends AbstractController<RequestDto> {
  protected async handle(): Promise<void> {
    const requestDto = RequestSchema.parse(this.request.query);
    const db = getConnection();
    const thesauriCol = db.collection<ThesaurusSchema>('dictionaries');

    const exists = await thesauriCol.findOne({ _id: ObjectId.createFromHexString(requestDto._id) });
    if (!exists) {
      throw new ThesaurusNotFoundError(requestDto._id);
    }

    const dao = TemplatesDAOFactory.default();
    const count = await dao.countByThesauri(requestDto._id);

    const responseDto: ResponseDto = count;

    this.response.json(responseDto);
  }
}

export { CountTemplatesByThesaurusController };
