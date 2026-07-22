import { z } from 'zod';
import { AbstractUseCase } from '../libs/UseCase.js';
import { Dispatcher } from './contracts/Dispatcher.js';

const RecoverPasswordInputSchema = z.object({
  email: z.string().min(3),
  domain: z.string(),
});

type Input = z.infer<typeof RecoverPasswordInputSchema>;

type Output = void;

type Deps = {
  dispatcher: Dispatcher;
};

class RecoverPassword extends AbstractUseCase<Input, Output, Deps> {
  async execute(input: Input): Promise<Output> {
    await this.deps.dispatcher.sendRecoveryEmail({
      domain: input.domain,
      email: input.email,
    });
  }
}

export { RecoverPassword, RecoverPasswordInputSchema };
export type { Deps as RecoverPasswordDependencies };
