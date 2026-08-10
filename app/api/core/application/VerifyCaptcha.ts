import { AbstractUseCase } from '../libs/UseCase.js';
import { CaptchaDataSource, CaptchaValue } from './contracts/CaptchaDataSource.js';
import { CaptchaInvalid } from '../domain/captcha/errors.js';

type Input = CaptchaValue;

type Deps = { captchaDS: CaptchaDataSource };

class VerifyCaptcha extends AbstractUseCase<Input, void, Deps> {
  async execute(input: Input): Promise<void> {
    const result = await this.deps.captchaDS.findById(input.id);

    if (result.isError() || result.getData()!.text !== input.text) {
      throw new CaptchaInvalid();
    }

    await this.deps.captchaDS.deleteById(input.id);
  }
}

export { VerifyCaptcha };
