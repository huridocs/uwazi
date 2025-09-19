import { AbstractController } from 'api/common.v2/infrastructure/AbstractController';
import settings from 'api/settings';
import templates from 'api/templates';
import { handleMappingConflict } from 'api/templates/routes';
import { handleError } from 'api/utils';

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
