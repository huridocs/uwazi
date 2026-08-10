/* eslint-disable max-classes-per-file */
import { DomainError } from '../error/DomainError.js';

class CaptchaInvalid extends DomainError {
  constructor() {
    super('Invalid captcha', 'captcha.invalid');
  }
}

class CaptchaNotFound extends DomainError {
  constructor(id: string) {
    super(`Captcha "${id}" not found`, 'captcha.not_found');
  }
}

export { CaptchaInvalid, CaptchaNotFound };
