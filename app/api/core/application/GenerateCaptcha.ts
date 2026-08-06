import svgCaptcha from 'svg-captcha';
import { AbstractUseCase } from '../libs/UseCase.js';
import { CaptchaDataSource } from './contracts/CaptchaDataSource.js';

type Output = { svg: string; id: string };

type Deps = { captchaDS: CaptchaDataSource };

class GenerateCaptcha extends AbstractUseCase<void, Output, Deps> {
  async execute(): Promise<Output> {
    const captcha = svgCaptcha.create({ ignoreChars: '0OoiILluvUV' });
    const text = process.env.DATABASE_NAME !== 'uwazi_e2e' ? captcha.text : '42hf';
    const { id } = await this.deps.captchaDS.create(text);

    return { svg: captcha.data, id };
  }
}

export { GenerateCaptcha };
