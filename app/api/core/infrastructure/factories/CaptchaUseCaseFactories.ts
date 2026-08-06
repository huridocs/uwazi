/* eslint-disable max-classes-per-file */
import { GenerateCaptcha } from '#api/core/application/GenerateCaptcha.js';
import { VerifyCaptcha } from '#api/core/application/VerifyCaptcha.js';
import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { MongoCaptchaDataSource } from '#api/core/infrastructure/mongodb/captcha/MongoCaptchaDataSource.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';

const captchaDataSource = () =>
  new MongoCaptchaDataSource({
    db: getConnection(),
    transactionManager: ExecutionContext.transactionManager,
  });

class GenerateCaptchaUseCaseFactory {
  static default() {
    return new GenerateCaptcha({ captchaDS: captchaDataSource() });
  }
}

class VerifyCaptchaUseCaseFactory {
  static default() {
    return new VerifyCaptcha({ captchaDS: captchaDataSource() });
  }
}

export { GenerateCaptchaUseCaseFactory, VerifyCaptchaUseCaseFactory };
