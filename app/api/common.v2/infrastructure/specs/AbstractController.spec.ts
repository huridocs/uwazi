import { z } from 'zod';
import { ValidationError } from 'ajv';

import { AbstractController } from '../AbstractController';

const Schema = z.object({
  name: z.string(),
});

class TestController extends AbstractController {
  // eslint-disable-next-line class-methods-use-this
  protected async handle(): Promise<void> {
    Schema.parse({ name: undefined });
  }
}

describe('AbstractController', () => {
  it('should catch and map zod error to ajv error', async () => {
    const controller = new TestController({
      request: undefined as any,
      response: undefined as any,
    });

    const promise = controller.handleAsync();
    await expect(promise).rejects.toThrow(ValidationError);
    await expect(promise).rejects.toMatchObject({
      errors: [
        {
          instancePath: 'name',
          message: 'Required',
        },
      ],
      validation: true,
      ajv: true,
    });
  });

  it('should rethrow other errors', async () => {
    const error = new Error('Test error');

    const controller = new TestController({
      request: undefined as any,
      response: undefined as any,
    });

    (controller as any).handle = () => {
      throw error;
    };

    const promise = controller.handleAsync();

    await expect(promise).rejects.toThrow(Error);
    await expect(promise).rejects.toMatchObject(error);
  });
});
