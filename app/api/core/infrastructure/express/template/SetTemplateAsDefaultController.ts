import { AbstractController } from 'api/common.v2/infrastructure/AbstractController';
import { TemplateSchema } from 'shared/types/templateType';
import { z } from 'zod';
import templates from 'api/templates';

const RequestSchema = z.object({
  _id: z.string({ message: 'You should provide an Id' }),
});

type RequestDto = z.infer<typeof RequestSchema>;

type ResponseDto = TemplateSchema;

class SetTemplateAsDefaultController extends AbstractController<RequestDto> {
  protected async handle(): Promise<void> {
    const requestDto: RequestDto = RequestSchema.parse(this.request.body);

    const [newDefault, oldDefault] = await templates.setAsDefault(requestDto._id);
    this.request.sockets.emitToCurrentTenant('templateChange', newDefault);

    if (oldDefault) {
      this.request.sockets.emitToCurrentTenant('templateChange', oldDefault);
    }

    const responseDto: ResponseDto = newDefault!;

    this.response.json(responseDto);
  }
}

export { SetTemplateAsDefaultController };
