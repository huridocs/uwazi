import { AbstractController } from '#api/common.v2/infrastructure/AbstractController.js';
import { ThesauriDAOFactory } from '../../factories/ThesauriDAOFactory.js';

class GetThesauriController extends AbstractController {
  protected async handle(): Promise<void> {
    const dao = ThesauriDAOFactory.default();

    const filter: { _id?: string } = {};
    if (this.request.query._id) {
      filter._id = this.request.query._id as string;
    }

    const dictionaries = await dao.get(filter);

    this.response.json({ rows: dictionaries });
  }
}

export { GetThesauriController };
