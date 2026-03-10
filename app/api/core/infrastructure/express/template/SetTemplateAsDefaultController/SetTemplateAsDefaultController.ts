import { AbstractController } from 'api/common.v2/infrastructure/AbstractController';
import { SetTemplateAsDefaultRequestDto, SetTemplateAsDefaultResponseDto } from './DTO';
import { TemplateFacade } from '../../../facades/TemplateFacade';

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
