/* eslint-disable max-classes-per-file */
import { GenerateCaptcha } from '#api/core/application/GenerateCaptcha.js';
import { VerifyCaptcha } from '#api/core/application/VerifyCaptcha.js';
import { CaptchaDataSourceFactory } from './CaptchaDataSourceFactory.js';

class GenerateCaptchaUseCaseFactory {
  static default() {
    return new GenerateCaptcha({ captchaDS: CaptchaDataSourceFactory.default() });
  }
}

class VerifyCaptchaUseCaseFactory {
  static default() {
    return new VerifyCaptcha({ captchaDS: CaptchaDataSourceFactory.default() });
  }
}

export { GenerateCaptchaUseCaseFactory, VerifyCaptchaUseCaseFactory };
