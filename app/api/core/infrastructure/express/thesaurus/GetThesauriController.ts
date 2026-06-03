import { z } from 'zod';
import { AbstractController } from '#api/common.v2/infrastructure/AbstractController.js';
import { ThesauriDAOFactory } from '../../factories/ThesauriDAOFactory.js';

const RequestSchema = z.object({
  _id: z.string().optional(),
});

class GetThesauriController extends AbstractController {
  protected async handle(): Promise<void> {
    const dao = ThesauriDAOFactory.default();

    const { _id } = RequestSchema.parse(this.request.query);

    const filter: { _id?: string } = {};
    if (_id) {
      filter._id = _id;
    }

    const dictionaries = await dao.get(filter);

    this.response.json({ rows: dictionaries });
  }
}

export { GetThesauriController };
