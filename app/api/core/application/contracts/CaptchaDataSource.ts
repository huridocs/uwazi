import { CaptchaNotFound } from '#api/core/domain/captcha/errors.js';
import { ResultType } from '#api/core/libs/Result.js';

type CaptchaValue = { id: string; text: string };
type CaptchaRecord = { id: string; text: string };

interface CaptchaDataSource {
  create(text: string): Promise<{ id: string }>;
  findById(id: string): Promise<ResultType<CaptchaRecord, CaptchaNotFound>>;
  deleteById(id: string): Promise<void>;
}

export type { CaptchaDataSource, CaptchaValue, CaptchaRecord };
