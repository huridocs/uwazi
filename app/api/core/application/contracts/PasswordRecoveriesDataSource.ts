import { RecoveryKeyNotFound } from '#api/core/domain/user/errors.js';
import { ResultType } from '#api/core/libs/Result.js';

type PasswordRecoveryLookup = {
  recordId: string;
  userId: string;
};

type CreateParams = {
  userId: string;
  key: string;
};

interface PasswordRecoveriesDataSource {
  create(params: CreateParams): Promise<void>;
  findByKey(key: string): Promise<ResultType<PasswordRecoveryLookup, RecoveryKeyNotFound>>;
  deleteById(id: string): Promise<void>;
}

export type { PasswordRecoveriesDataSource, PasswordRecoveryLookup, CreateParams };
