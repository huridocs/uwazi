import { AbstractController } from '#api/common.v2/infrastructure/AbstractController.js';
import { RemoveTemplateFromFiltersUseCaseFactory } from '#api/core/infrastructure/factories/RemoveTemplateFromFiltersUseCaseFactory.js';
import { SettingsQueryServiceFactory } from '#api/core/infrastructure/factories/SettingsQueryServiceFactory.js';
import { TemplateFacade } from '#api/core/infrastructure/facades/TemplateFacade.js';
import { DeleteTemplateRequestDto, DeleteTemplateResponseDto } from './DTO.js';

class DeleteTemplateController extends AbstractController<DeleteTemplateRequestDto> {
  protected async handle(): Promise<void> {
    const output = await TemplateFacade.delete(this.request.query as DeleteTemplateRequestDto);

    const filtersChanged = await RemoveTemplateFromFiltersUseCaseFactory.default().execute({
      templateId: output._id,
    });

    if (filtersChanged) {
      const publicSettings = await SettingsQueryServiceFactory.default().getPublic();
      this.request.sockets.emitToCurrentTenant('updateSettings', publicSettings);
    }
    this.request.sockets.emitToCurrentTenant('templateDelete', output);

    const responseDto: DeleteTemplateResponseDto = output;

    this.response.json(responseDto);
  }
}

export { DeleteTemplateController };
