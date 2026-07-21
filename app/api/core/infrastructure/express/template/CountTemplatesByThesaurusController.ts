import { z } from 'zod';
import { AbstractController } from '#api/common.v2/infrastructure/AbstractController.js';
import { ThesaurusNotFoundError } from '#api/core/domain/thesaurus/errors.js';
import { TemplatesDAOFactory } from '#api/core/infrastructure/factories/TemplatesDAOFactory.js';
import { ThesauriDAOFactory } from '#api/core/infrastructure/factories/ThesauriDAOFactory.js';

const RequestSchema = z.object({
  _id: z.string({ message: 'You should provide an Id' }),
});

type RequestDto = z.infer<typeof RequestSchema>;

type ResponseDto = number;

class CountTemplatesByThesaurusController extends AbstractController<RequestDto> {
  protected async handle(): Promise<void> {
    const requestDto = RequestSchema.parse(this.request.query);

    const thesauridao = ThesauriDAOFactory.default();

    const exists = await thesauridao.get([requestDto._id]);
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
