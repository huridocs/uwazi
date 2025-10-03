import { AbstractController } from 'api/common.v2/infrastructure/AbstractController';
import { z } from 'zod';
import templates from 'api/templates';
import settings from 'api/settings';

const RequestSchema = z.object({
  _id: z.string({ message: 'You should provide an Id' }),
});

type RequestDto = z.infer<typeof RequestSchema>;

type ResponseDto = { _id: string };

class DeleteTemplateController extends AbstractController<RequestDto> {
  protected async handle(): Promise<void> {
    const requestDto = RequestSchema.parse(this.request.query);

    await templates.delete(requestDto);

    const newSettings = await settings.removeTemplateFromFilters(requestDto._id);

    this.request.sockets.emitToCurrentTenant('updateSettings', newSettings);
    this.request.sockets.emitToCurrentTenant('templateDelete', requestDto);

    const responseDto: ResponseDto = requestDto;

    this.response.json(responseDto);
  }
}

export { DeleteTemplateController };
