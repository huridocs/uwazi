import { RecoveryKeyNotFound } from '#api/core/domain/user/errors.js';
import { ResultType } from '#api/core/libs/Result.js';

type PasswordRecoveryLookup = {
  recordId: string;
  userId: string;
};

interface PasswordRecoveriesDataSource {
  findByKey(key: string): Promise<ResultType<PasswordRecoveryLookup, RecoveryKeyNotFound>>;
  deleteById(id: string): Promise<void>;
}

export type { PasswordRecoveriesDataSource, PasswordRecoveryLookup };
