export interface User {
  _id?: any;
  username?: string;
  password?: string;
  email?: string;
  role?: 'admin' | 'editor' | 'collaborator';
  failedLogins?: number;
  accountLocked?: boolean;
  accountUnlockCode?: string;
  using2fa?: boolean;
  secret?: string | null;
  deletedAt?: Date;
}
