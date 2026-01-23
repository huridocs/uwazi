import { AbstractController } from '#api/common.v2/infrastructure/AbstractController.js';
import settings from '#api/settings/index.js';
import { TemplateFacade } from '#api/core/infrastructure/facades/TemplateFacade.js';
import {
  DeleteTemplateRequestDto,
  DeleteTemplateResponseDto,
} from '#api/core/infrastructure/express/template/DeleteTemplateController/DTO.js';

class DeleteTemplateController extends AbstractController<DeleteTemplateRequestDto> {
  protected async handle(): Promise<void> {
    const output = await TemplateFacade.delete(this.request.query as DeleteTemplateRequestDto);

    const newSettings = await settings.removeTemplateFromFilters(output._id);

    this.request.sockets.emitToCurrentTenant('updateSettings', newSettings);
    this.request.sockets.emitToCurrentTenant('templateDelete', output);

    const responseDto: DeleteTemplateResponseDto = output;

    this.response.json(responseDto);
  }
}

export { DeleteTemplateController };
