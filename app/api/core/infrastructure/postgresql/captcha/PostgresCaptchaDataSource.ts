import {
  CaptchaDataSource,
  CaptchaRecord,
} from '#api/core/application/contracts/CaptchaDataSource.js';
import { IdGenerator } from '#api/core/application/contracts/IdGenerator.js';
import { CaptchaNotFound } from '#api/core/domain/captcha/errors.js';
import { Result, ResultType } from '#api/core/libs/Result.js';
import { PostgresDataSource, PostgresDataSourceDeps } from '../common/PostgresDataSource.js';
import type { CaptchaRow } from './PostgresCaptchaRow.js';

const TEN_HOURS_IN_MS = 10 * 60 * 60 * 1000;

type Deps = PostgresDataSourceDeps & { idGenerator: IdGenerator };

class PostgresCaptchaDataSource extends PostgresDataSource<CaptchaRow> implements CaptchaDataSource {
  private idGenerator: IdGenerator;

  constructor(deps: Deps) {
    super('captchas', deps);
    this.idGenerator = deps.idGenerator;
  }

  async create(text: string): Promise<{ id: string }> {
    const _id = this.idGenerator.generate();
    await this.table.insert({
      _id,
      text,
      expiresAt: new Date(Date.now() + TEN_HOURS_IN_MS),
    });
    return { id: _id };
  }

  async findById(id: string): Promise<ResultType<CaptchaRecord, CaptchaNotFound>> {
    const row = await this.table.where({ _id: id }).whereRaw('"expiresAt" > now()').first();

    if (!row) {
      return Result.fail(new CaptchaNotFound(id));
    }

    return Result.ok({ id: row._id, text: row.text });
  }

  async deleteById(id: string): Promise<void> {
    await this.table.where({ _id: id }).delete();
  }
}

export { PostgresCaptchaDataSource };
