type UserRow = {
  _id: string;
  username: string;
  password?: string;
  email: string;
  role: string;
  failedLogins?: number;
  accountLocked?: boolean;
  accountUnlockCode?: string | null;
  using2fa?: boolean;
  secret?: string | null;
  deletedAt?: Date;
};

export type { UserRow };
