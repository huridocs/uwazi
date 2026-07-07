import { AbstractController } from '#api/common.v2/infrastructure/AbstractController.js';
import { UsersDAOFactory } from '../../factories/UsersDAOFactory.js';

class GetUsersController extends AbstractController {
  protected async handle(): Promise<void> {
    const dao = UsersDAOFactory.default();
    const users = await dao.get({});

    const sanitized = users.map(({ password, using2fa, secret, deletedAt, ...rest }) => rest);

    this.response.json(sanitized);
  }
}

export { GetUsersController };
