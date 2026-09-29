import { inspect } from 'util';
import { AbstractController } from '#api/common.v2/infrastructure/AbstractController.js';
import { createError } from '#api/utils/index.js';
import { TemplateFacade } from '../../facades/TemplateFacade.js';
import { TemplateDBO } from '../../mongodb/template/DBOs/TemplateDBO.js';

type TemplateMutationResponseDTO = TemplateDBO;

class TemplateMutationController extends AbstractController {
  protected async handle(): Promise<void> {
    try {
      let response: TemplateMutationResponseDTO;

      if (!this.request.body?._id) {
        response = await TemplateFacade.create(this.request.body);
      } else {
        response = await TemplateFacade.update(this.request.body, this.language);
      }

      this.request.sockets.emitToCurrentTenant('templateChange', response);
      this.response.json(response);
    } catch (error) {
      if (error.meta?.body?.error?.reason?.match(/mapp(?:ing|er)/)) {
        throw createError(`mapping conflict: ${inspect(error)}`, 409);
      }

      throw error;
    }
  }
}

export { TemplateMutationController };
