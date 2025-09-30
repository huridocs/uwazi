import { AbstractController } from 'api/common.v2/infrastructure/AbstractController';
import { TemplateSchema } from 'shared/types/templateType';
import { z } from 'zod';
import templates from 'api/templates';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const RequestSchema = z.object({
  _id: z.string({ message: 'You should provide an Id' }),
});

type RequestDto = z.infer<typeof RequestSchema>;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
type ResponseDto = TemplateSchema;

class SetTemplateAsDefaultController extends AbstractController<RequestDto> {
  protected async handle(): Promise<void> {
    const [newDefault, oldDefault] = await templates.setAsDefault(this.request.body._id.toString());
    this.request.sockets.emitToCurrentTenant('templateChange', newDefault);

    if (oldDefault) {
      this.request.sockets.emitToCurrentTenant('templateChange', oldDefault);
    }

    this.response.json(newDefault);
  }
}

export { SetTemplateAsDefaultController };
