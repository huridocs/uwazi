type PasswordRecoveryRow = {
  _id: string;
  key: string;
  userId: string;
  expiresAt: Date;
};

export type { PasswordRecoveryRow };
