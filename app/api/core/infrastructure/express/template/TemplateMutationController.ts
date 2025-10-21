import { AbstractController } from 'api/common.v2/infrastructure/AbstractController';
import settings from 'api/settings';
import { createError } from 'api/utils';
import { inspect } from 'util';
import { TemplateDBO } from '../../mongodb/template/DBOs/TemplateDBO';
import { TemplateFacade } from '../../facades/TemplateFacade';

type TemplateMutationResponseDTO = TemplateDBO;

class TemplateMutationController extends AbstractController {
  // eslint-disable-next-line max-statements
  protected async handle(): Promise<void> {
    try {
      let response: TemplateMutationResponseDTO;

      if (!this.request.body?._id) {
        response = await TemplateFacade.create(this.request.body);
      } else {
        response = await TemplateFacade.update(this.request.body, this.language);
      }

      const updatedSettings = await settings.updateFilterName(
        response._id.toString(),
        response.name
      );

      if (updatedSettings) {
        this.request.sockets.emitToCurrentTenant('updateSettings', updatedSettings);
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
