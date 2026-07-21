import { ObjectId } from 'mongodb';
import { UserRole } from '#api/core/domain/user/User.js';

interface UserDBO {
  _id: ObjectId;
  username: string;
  role: UserRole;
  email: string;
  password?: string;
  using2fa?: boolean;
  secret?: string | null;
  deletedAt?: Date | null;
  accountLocked?: boolean;
  failedLogins?: number;
  accountUnlockCode?: string;
}

export type { UserDBO };
