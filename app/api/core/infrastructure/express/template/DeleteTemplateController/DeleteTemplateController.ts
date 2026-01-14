import { AbstractController } from 'api/common.v2/infrastructure/AbstractController';
import settings from 'api/settings';
import { TemplateFacade } from 'api/core/infrastructure/facades/TemplateFacade';
import { DeleteTemplateRequestDto, DeleteTemplateResponseDto } from './DTO';

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
