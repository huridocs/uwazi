import { AbstractController } from '#api/common.v2/infrastructure/AbstractController.js';
import { TemplateFacade } from '#api/core/infrastructure/facades/TemplateFacade.js';
import { DeleteTemplateRequestDto, DeleteTemplateResponseDto } from './DTO.js';

class DeleteTemplateController extends AbstractController<DeleteTemplateRequestDto> {
  protected async handle(): Promise<void> {
    const output = await TemplateFacade.delete(this.request.query as DeleteTemplateRequestDto);

    this.request.sockets.emitToCurrentTenant('templateDelete', output);

    const responseDto: DeleteTemplateResponseDto = output;

    this.response.json(responseDto);
  }
}

export { DeleteTemplateController };
