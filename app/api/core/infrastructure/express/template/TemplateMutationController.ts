import { AbstractController } from '../../../../common.v2/infrastructure/AbstractController.js';
import settings from '../../../../settings/index.js';
import templates from '../../../../templates/index.js';
import { handleMappingConflict } from '../../../../templates/routes.js';
import { handleError } from '../../../../utils/index.js';

class TemplateMutationController extends AbstractController {
  protected async handle(): Promise<void> {
    const { reindex: fullReindex, ...template } = this.request.body;

    const response = await handleMappingConflict(async () =>
      templates.save(
        template,
        this.language,
        !fullReindex,
        fullReindex,
        async (error?: Error, fullyProcessed?: boolean) => {
          if (error) {
            handleError(error, { req: this.request });
          }
          if (fullyProcessed) {
            this.request.sockets.emitToCurrentTenant('templateProcessed', {
              templateId: template._id.toString(),
            });
          }
        }
      )
    );

    this.request.sockets.emitToCurrentTenant('templateChange', response);

    const updatedSettings = await settings.updateFilterName(response._id.toString(), response.name);

    if (updatedSettings) {
      this.request.sockets.emitToCurrentTenant('updateSettings', updatedSettings);
    }

    this.response.json(response);
  }
}

export { TemplateMutationController };
