import { AbstractController } from '#api/common.v2/infrastructure/AbstractController.js';
import { SetTemplateAsDefaultRequestDto, SetTemplateAsDefaultResponseDto } from '#api/core/infrastructure/express/template/SetTemplateAsDefaultController/DTO.js';
import { TemplateFacade } from '#api/core/infrastructure/facades/TemplateFacade.js';

class SetTemplateAsDefaultController extends AbstractController<SetTemplateAsDefaultRequestDto> {
  protected async handle(): Promise<void> {
    const [newDefault, oldDefault] = await TemplateFacade.setAsDefault(this.request.body);

    this.request.sockets.emitToCurrentTenant('templateChange', newDefault);

    if (oldDefault) {
      this.request.sockets.emitToCurrentTenant('templateChange', oldDefault);
    }

    const responseDto: SetTemplateAsDefaultResponseDto = newDefault!;

    this.response.json(responseDto);
  }
}

export { SetTemplateAsDefaultController };
